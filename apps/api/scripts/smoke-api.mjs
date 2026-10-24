import dotenv from "dotenv";
import { resolve } from "node:path";
import pg from "pg";

dotenv.config({ path: resolve(import.meta.dirname, "../../../.env") });
const api = process.env.API_BASE_URL ?? "http://localhost:8080";
const databaseUrl = new URL(process.env.DATABASE_URL);
databaseUrl.searchParams.delete("sslmode");
const client = new pg.Client({
  connectionString: databaseUrl.toString(),
  ssl: {
    ca: process.env.RUMPTY_POSTGRES_CA_BASE64
      ? Buffer.from(process.env.RUMPTY_POSTGRES_CA_BASE64, "base64")
      : process.env.RUMPTY_POSTGRES_CA_CERT
        ? (await import("node:fs")).readFileSync(
            resolve(process.env.RUMPTY_POSTGRES_CA_CERT),
          )
        : undefined,
    rejectUnauthorized: true,
  },
  connectionTimeoutMillis: 15000,
});
const createdIds = [];

async function call(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(`${method} ${path} returned HTTP ${response.status}`);
  return value;
}

try {
  await client.connect();
  const suffix = crypto.randomUUID();
  const patient = await call("/auth/register", {
    method: "POST",
    body: {
      displayName: "Smoke Patient",
      email: `patient-${suffix}@example.test`,
      password: "SmokeTestPassword123!",
      role: "PREGNANT_PERSON",
    },
  });
  createdIds.push(patient.user.id);
  const midwife = await call("/auth/register", {
    method: "POST",
    body: {
      displayName: "Smoke Midwife",
      email: `midwife-${suffix}@example.test`,
      password: "SmokeTestPassword123!",
      role: "MIDWIFE",
      inviteCode: process.env.MIDWIFE_INVITE_CODE,
    },
  });
  createdIds.push(midwife.user.id);
  const pregnancy = await call("/records/pregnancy", {
    method: "POST",
    token: patient.token,
    body: { dueDate: "2027-05-01", nextVisitDate: "2027-04-05" },
  });
  const checkin = await call("/records/check-ins", {
    method: "POST",
    token: patient.token,
    body: { mood: "okay", symptoms: [] },
  });
  const meal = await call("/records/meals", {
    method: "POST",
    token: patient.token,
    body: {
      foodName: "Oats, rolled, raw",
      mealType: "Breakfast",
      servingGrams: "150",
      nutrients: { ironMg: 6.6 },
      source: "FAO/INFOODS WAFCT 2019",
    },
  });
  const plan = await call("/records/meal-plan", {
    method: "POST",
    token: patient.token,
    body: {
      planDate: "2027-04-05",
      mealType: "Lunch",
      dishName: "Fufu and Egusi Soup",
    },
  });
  const groceryBuild = await call("/records/groceries/from-plan", {
    method: "POST",
    token: patient.token,
  });
  const groceryItems = await call("/records/groceries", {
    token: patient.token,
  });
  const grocery = await call("/records/groceries", {
    method: "POST",
    token: patient.token,
    body: { name: "Beans", quantity: "1 cup" },
  });
  const link = await call("/records/care-links", {
    method: "POST",
    token: patient.token,
    body: { email: midwife.user.email },
  });
  const requests = await call("/records/care-team/requests", {
    token: midwife.token,
  });
  const approval = await call(
    `/records/care-team/requests/${link.id}/approve`,
    { method: "POST", token: midwife.token },
  );
  const patients = await call("/records/care-team/patients", {
    token: midwife.token,
  });
  const auth = await call("/auth/me", { token: patient.token });
  const foods = await call("/pregnancy/foods?q=oats rolled raw");
  const code = foods.foods?.find(
    (food) =>
      food.source === "FAO/INFOODS Western Africa Food Composition Table 2019",
  )?.foodCode;
  const portion = code
    ? await call("/pregnancy/foods/portion", {
        method: "POST",
        body: { foodCode: code, servingGrams: 150 },
      })
    : null;
  const mealIdeas = await call("/pregnancy/meal-plan/ideas", {
    method: "POST",
    body: {
      week: 24,
      region: "Any",
      budget: "Affordable",
      vegetarian: true,
      avoidIngredients: ["fish"],
    },
  });
  const cachedWeek = await call("/pregnancy/week", {
    method: "POST",
    body: { week: 33 },
  });
  const pushConfiguration = await call("/notifications/vapid-public-key");
  const initialReviews = await call("/records/clinical-reviews", {
    token: midwife.token,
  });
  const review = await call("/records/clinical-reviews/42", {
    method: "POST",
    token: midwife.token,
    body: { status: "CHANGES_REQUESTED", notes: "Smoke test review." },
  });
  const updatedReviews = await call("/records/clinical-reviews", {
    token: midwife.token,
  });
  if (
    !pregnancy.id ||
    pregnancy.nextVisitDate?.slice(0, 10) !== "2027-04-05" ||
    !checkin.id ||
    !meal.id ||
    !plan.id ||
    !grocery.id ||
    !groceryBuild.expandedMeals ||
    !groceryItems.some((item) => item.name === "egusi seeds") ||
    !requests.length ||
    !approval.approved ||
    !patients.some((p) => p.id === patient.user.id) ||
    auth.id !== patient.user.id ||
    !portion?.nutrients?.ironMg ||
    mealIdeas.ideas?.length !== 7 ||
    initialReviews.length !== 42 ||
    review.status !== "CHANGES_REQUESTED" ||
    updatedReviews.find((item) => item.week === 42)?.status !==
      "CHANGES_REQUESTED" ||
    !cachedWeek.citationPages?.length ||
    !cachedWeek.bookNote ||
    !pushConfiguration.publicKey
  )
    throw new Error("One or more API smoke assertions failed.");
  console.log(
    "API smoke flow passed: accounts, records, portion-level micronutrients, meal ideas, clinical-review audit, ingredient-based groceries and consented care links.",
  );
} finally {
  if (createdIds.length)
    await client.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [
      createdIds,
    ]);
  await client.end().catch(() => {});
}
