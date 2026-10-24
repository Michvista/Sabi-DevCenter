import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Optional,
  ServiceUnavailableException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { randomUUID } from "node:crypto";
import { InjectDataSource } from "@nestjs/typeorm";
import type { DataSource } from "typeorm";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { PregnancyEntity } from "../database/entities/pregnancy.entity";
import { CheckInEntity } from "../database/entities/check-in.entity";
import { MealLogEntity } from "../database/entities/meal-log.entity";
import { CareLinkEntity } from "../database/entities/care-link.entity";
import { UserEntity } from "../database/entities/user.entity";
import { MealPlanEntity } from "../database/entities/meal-plan.entity";
import { GroceryItemEntity } from "../database/entities/grocery-item.entity";
import { FoodSearchService } from "../infrastructure/food-search.service";
import { ClinicalContentReviewEntity } from "../database/entities/clinical-content-review.entity";
import { CareMessageEntity } from "../database/entities/care-message.entity";

class SendMessageDto {
  @IsString() @MaxLength(2000) content!: string;
}

class PregnancyDto {
  @IsString() dueDate!: string;
  @IsOptional() @IsString() lastMenstrualPeriod?: string;
  @IsOptional() @IsDateString() nextVisitDate?: string | null;
}
class CheckInDto {
  @IsString() @MaxLength(20) mood!: string;
  @IsArray() @IsString({ each: true }) symptoms!: string[];
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}
class MealDto {
  @IsString() @MaxLength(160) foodName!: string;
  @IsString()
  @IsIn(["Breakfast", "Lunch", "Dinner", "Snack"])
  mealType!: string;
  @IsOptional() @IsString() servingGrams?: string;
  @IsOptional() nutrients?: Record<string, number>;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() @MaxLength(120) note?: string;
}
class LinkDto {
  @IsString() @MaxLength(8) code!: string;
}
class PlanDto {
  @IsDateString() planDate!: string;
  @IsIn(["Breakfast", "Lunch", "Dinner", "Snack"]) mealType!: string;
  @IsString() @MaxLength(160) dishName!: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
class GroceryDto {
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(80) quantity?: string;
}
class GroceryCheckDto {
  @IsBoolean() checked!: boolean;
}
class ClinicalReviewDto {
  @IsIn(["APPROVED", "CHANGES_REQUESTED"])
  status!: "APPROVED" | "CHANGES_REQUESTED";
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

@Controller("records")
@UseGuards(AuthGuard)
export class RecordsController {
  constructor(
    @Optional() @InjectDataSource() private readonly db?: DataSource,
    @Optional() private readonly foods?: FoodSearchService,
  ) {}

  private database() {
    if (!this.db?.isInitialized)
      throw new ServiceUnavailableException(
        "Rumpty PostgreSQL is currently unavailable; health records are not being saved.",
      );
    return this.db;
  }

  @Get("pregnancy")
  async getPregnancy(@Req() req: AuthenticatedRequest) {
    if (req.auth.role !== "PREGNANT_PERSON") return [];
    return this.database()
      .getRepository(PregnancyEntity)
      .findOneBy({ userId: req.auth.userId });
  }

  @Post("pregnancy")
  async savePregnancy(
    @Req() req: AuthenticatedRequest,
    @Body() body: PregnancyDto,
  ) {
    if (req.auth.role !== "PREGNANT_PERSON")
      return { message: "Only the pregnant person can edit this record." };
    const due = new Date(`${body.dueDate}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) ||
      Number.isNaN(due.valueOf())
    )
      throw new Error("Enter a valid due date.");
    const repo = this.database().getRepository(PregnancyEntity);
    const record =
      (await repo.findOneBy({ userId: req.auth.userId })) ??
      repo.create({ id: randomUUID(), userId: req.auth.userId });
    record.dueDate = body.dueDate;
    record.lastMenstrualPeriod = body.lastMenstrualPeriod ?? null;
    if (Object.prototype.hasOwnProperty.call(body, "nextVisitDate")) {
      record.nextVisitDate = body.nextVisitDate ?? null;
    }
    return repo.save(record);
  }

  @Get("check-ins")
  checkIns(@Req() req: AuthenticatedRequest) {
    return this.database()
      .getRepository(CheckInEntity)
      .find({
        where: { userId: req.auth.userId },
        order: { createdAt: "DESC" },
        take: 50,
      });
  }

  @Post("check-ins")
  async saveCheckIn(
    @Req() req: AuthenticatedRequest,
    @Body() body: CheckInDto,
  ) {
    if (req.auth.role !== "PREGNANT_PERSON")
      return { message: "Only the pregnant person can add a check-in." };
    return this.database()
      .getRepository(CheckInEntity)
      .save({
        id: randomUUID(),
        userId: req.auth.userId,
        mood: body.mood,
        symptoms: body.symptoms,
        note: body.note ?? null,
      });
  }

  @Get("meals")
  meals(@Req() req: AuthenticatedRequest) {
    return this.database()
      .getRepository(MealLogEntity)
      .find({
        where: { userId: req.auth.userId },
        order: { createdAt: "DESC" },
        take: 100,
      });
  }

  @Post("meals")
  async addMeal(@Req() req: AuthenticatedRequest, @Body() body: MealDto) {
    if (req.auth.role !== "PREGNANT_PERSON")
      return { message: "Only the pregnant person can add meals." };
    const grams =
      body.servingGrams === undefined ? null : Number(body.servingGrams);
    if (
      grams !== null &&
      (!Number.isFinite(grams) || grams <= 0 || grams > 5000)
    )
      throw new Error("Serving size must be between 1 and 5000 grams.");
    return this.database()
      .getRepository(MealLogEntity)
      .save({
        id: randomUUID(),
        userId: req.auth.userId,
        foodName: body.foodName,
        mealType: body.mealType,
        servingGrams: grams?.toFixed(2) ?? null,
        nutrients: body.nutrients ?? {},
        source: body.source ?? null,
        note: body.note ?? null,
      });
  }

  @Delete("meals/:id")
  async removeMeal(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    if (req.auth.role !== "PREGNANT_PERSON") return { deleted: false };
    const result = await this.database()
      .getRepository(MealLogEntity)
      .delete({ id, userId: req.auth.userId });
    return { deleted: result.affected === 1 };
  }

  @Get("meal-plan")
  mealPlan(@Req() req: AuthenticatedRequest) {
    return this.database()
      .getRepository(MealPlanEntity)
      .find({
        where: { userId: req.auth.userId },
        order: { planDate: "ASC", createdAt: "ASC" },
        take: 100,
      });
  }

  @Post("meal-plan")
  async addPlan(@Req() req: AuthenticatedRequest, @Body() body: PlanDto) {
    if (req.auth.role !== "PREGNANT_PERSON")
      return { message: "Only the pregnant person can plan meals." };
    return this.database()
      .getRepository(MealPlanEntity)
      .save({
        id: randomUUID(),
        userId: req.auth.userId,
        planDate: body.planDate.slice(0, 10),
        mealType: body.mealType,
        dishName: body.dishName,
        note: body.note ?? null,
      });
  }

  @Get("groceries")
  groceries(@Req() req: AuthenticatedRequest) {
    return this.database()
      .getRepository(GroceryItemEntity)
      .find({
        where: { userId: req.auth.userId },
        order: { checked: "ASC", updatedAt: "DESC" },
      });
  }

  @Post("groceries")
  async addGrocery(@Req() req: AuthenticatedRequest, @Body() body: GroceryDto) {
    if (req.auth.role !== "PREGNANT_PERSON")
      return { message: "Only the pregnant person can edit the grocery list." };
    return this.database()
      .getRepository(GroceryItemEntity)
      .save({
        id: randomUUID(),
        userId: req.auth.userId,
        name: body.name.trim(),
        quantity: body.quantity?.trim() || null,
        checked: false,
      });
  }

  @Post("groceries/from-plan")
  async groceriesFromPlan(@Req() req: AuthenticatedRequest) {
    if (req.auth.role !== "PREGNANT_PERSON") return { added: 0 };
    const entries = await this.database()
      .getRepository(MealPlanEntity)
      .find({ where: { userId: req.auth.userId } });
    let expandedMeals = 0;
    const names = [
      ...new Set(
        entries.flatMap((item) => {
          const ingredients =
            this.foods?.ingredientsForDish(item.dishName) ?? [];
          if (ingredients.length) expandedMeals += 1;
          return ingredients.length ? ingredients : [item.dishName.trim()];
        }),
      ),
    ];
    const repo = this.database().getRepository(GroceryItemEntity);
    let added = 0;
    for (const name of names) {
      if (!(await repo.existsBy({ userId: req.auth.userId, name }))) {
        await repo.save({
          id: randomUUID(),
          userId: req.auth.userId,
          name,
          quantity: "For planned meals",
          checked: false,
        });
        added += 1;
      }
    }
    return { added, expandedMeals };
  }

  @Post("groceries/:id/check")
  async toggleGrocery(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: GroceryCheckDto,
  ) {
    const repo = this.database().getRepository(GroceryItemEntity);
    await repo.update(
      { id, userId: req.auth.userId },
      { checked: body.checked },
    );
    return repo.findOneBy({ id, userId: req.auth.userId });
  }

  @Get("clinical-reviews")
  async clinicalReviews(@Req() req: AuthenticatedRequest) {
    if (req.auth.role !== "MIDWIFE")
      throw new ForbiddenException(
        "Only care-team accounts can review educational content.",
      );
    const rows = await this.database()
      .getRepository(ClinicalContentReviewEntity)
      .find({
        order: { createdAt: "DESC" },
      });
    const latest = new Map<number, ClinicalContentReviewEntity>();
    for (const row of rows)
      if (!latest.has(row.week)) latest.set(row.week, row);
    return Array.from({ length: 42 }, (_, index) => {
      const week = index + 1;
      const row = latest.get(week);
      return {
        week,
        status: row?.status ?? "PENDING",
        notes: row?.notes ?? null,
        reviewedAt: row?.createdAt ?? null,
      };
    });
  }

  @Post("clinical-reviews/:week")
  async reviewClinicalWeek(
    @Req() req: AuthenticatedRequest,
    @Param("week") rawWeek: string,
    @Body() body: ClinicalReviewDto,
  ) {
    if (req.auth.role !== "MIDWIFE")
      throw new ForbiddenException(
        "Only care-team accounts can review educational content.",
      );
    const week = Number(rawWeek);
    if (!Number.isInteger(week) || week < 1 || week > 42)
      throw new BadRequestException("Week must be between 1 and 42.");
    return this.database()
      .getRepository(ClinicalContentReviewEntity)
      .save({
        id: randomUUID(),
        week,
        reviewerId: req.auth.userId,
        status: body.status,
        notes: body.notes?.trim() || null,
      });
  }

  @Delete("groceries/:id")
  async removeGrocery(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    const result = await this.database()
      .getRepository(GroceryItemEntity)
      .delete({ id, userId: req.auth.userId });
    return { deleted: result.affected === 1 };
  }

  @Post("care-team/generate-code")
  async generateCareCode(@Req() req: AuthenticatedRequest) {
    if (req.auth.role !== "MIDWIFE")
      throw new ForbiddenException("Only a midwife can generate a connection code.");
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await this.database()
      .getRepository(UserEntity)
      .update({ id: req.auth.userId }, { connectionCode: code } as Partial<UserEntity>);
    return { code };
  }

  @Get("care-team/my-code")
  async getMyCareCode(@Req() req: AuthenticatedRequest) {
    if (req.auth.role !== "MIDWIFE")
      throw new ForbiddenException("Only a midwife can view their connection code.");
    const user = await this.database()
      .getRepository(UserEntity)
      .findOne({ where: { id: req.auth.userId }, select: ["id", "connectionCode"] });
    return { code: user?.connectionCode ?? null };
  }

  @Post("care-links")
  async requestCareLink(
    @Req() req: AuthenticatedRequest,
    @Body() body: LinkDto,
  ) {
    if (req.auth.role !== "PREGNANT_PERSON")
      return { message: "Only a pregnant person can request a care link." };
    const midwife = await this.database()
      .getRepository(UserEntity)
      .findOneBy({ connectionCode: body.code.trim().toUpperCase(), role: "MIDWIFE" });
    if (!midwife)
      return { message: "No care-team account was found for that code. Ask your midwife for their Sabi code." };
    const repo = this.database().getRepository(CareLinkEntity);
    const existing = await repo.findOneBy({
      patientId: req.auth.userId,
      midwifeId: midwife.id,
    });
    if (existing) return existing;
    return repo.save({
      id: randomUUID(),
      patientId: req.auth.userId,
      midwifeId: midwife.id,
      status: "pending",
    });
  }

  @Get("care-links/status")
  async getMyCareLink(@Req() req: AuthenticatedRequest) {
    if (req.auth.role !== "PREGNANT_PERSON") return { connected: false };
    const link = await this.database()
      .createQueryBuilder()
      .select("l.id", "id")
      .addSelect("l.status", "status")
      .addSelect("m.display_name", "midwifeName")
      .addSelect("m.email", "midwifeEmail")
      .from("care_links", "l")
      .innerJoin("users", "m", "m.id = l.midwife_id")
      .where("l.patient_id = :id AND l.status = 'active'", { id: req.auth.userId })
      .getRawOne();
    if (!link) return { connected: false };
    return {
      connected: true,
      status: link.status,
      midwifeName: link.midwifeName,
      midwifeEmail: link.midwifeEmail,
    };
  }


  @Get("care-team/requests")
  async careRequests(@Req() req: AuthenticatedRequest) {
    if (req.auth.role !== "MIDWIFE") return [];
    return this.database()
      .createQueryBuilder()
      .select("l.id", "id")
      .addSelect("u.display_name", "patientName")
      .addSelect("u.email", "patientEmail")
      .addSelect("l.created_at", "requestedAt")
      .from("care_links", "l")
      .innerJoin("users", "u", "u.id = l.patient_id")
      .where("l.midwife_id = :id AND l.status = 'pending'", {
        id: req.auth.userId,
      })
      .getRawMany();
  }

  @Post("care-team/requests/:id/approve")
  async approveCareRequest(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    if (req.auth.role !== "MIDWIFE") return { approved: false };
    const result = await this.database()
      .getRepository(CareLinkEntity)
      .update(
        { id, midwifeId: req.auth.userId, status: "pending" },
        { status: "active" },
      );
    return { approved: result.affected === 1 };
  }

  @Get("care-team/patients")
  async patients(@Req() req: AuthenticatedRequest) {
    if (req.auth.role !== "MIDWIFE") return [];
    return this.database().query(
      `SELECT u.id AS id, u.display_name AS "displayName", u.email AS email,
              p.due_date AS "dueDate", p.next_visit_date AS "nextVisitDate",
              c.created_at AS "checkInAt", c.mood AS mood,
              c.symptoms AS symptoms, c.note AS note
       FROM care_links l
       INNER JOIN users u ON u.id = l.patient_id
       LEFT JOIN pregnancies p ON p.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT created_at, mood, symptoms, note FROM check_ins
         WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
       ) c ON TRUE
       WHERE l.midwife_id = $1 AND l.status = 'active'`,
      [req.auth.userId],
    );
  }

  @Get("care-team/patients/:id/check-ins")
  async patientCheckIns(
    @Req() req: AuthenticatedRequest,
    @Param("id") patientId: string,
  ) {
    if (req.auth.role !== "MIDWIFE") return [];
    // Ensure active care link exists
    const hasLink = await this.database()
      .getRepository(CareLinkEntity)
      .existsBy({ patientId, midwifeId: req.auth.userId, status: "active" });
    if (!hasLink) throw new ForbiddenException("No active care link with this patient.");
    return this.database().getRepository(CheckInEntity).find({
      where: { userId: patientId },
      order: { createdAt: "DESC" },
      take: 20,
    });
  }

  @Get("care-messages")
  async getCareMessages(
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.auth.role === "PREGNANT_PERSON") {
      const link = await this.database()
        .getRepository(CareLinkEntity)
        .findOneBy({ patientId: req.auth.userId, status: "active" });
      if (!link) return [];
      return this.database().getRepository(CareMessageEntity).find({
        where: { patientId: req.auth.userId, midwifeId: link.midwifeId },
        order: { createdAt: "ASC" },
        take: 100,
      });
    }
    return [];
  }

  @Post("care-messages")
  async sendMessage(
    @Req() req: AuthenticatedRequest,
    @Body() body: SendMessageDto,
  ) {
    if (req.auth.role !== "PREGNANT_PERSON")
      throw new ForbiddenException("Only pregnant patients can send messages through this endpoint.");
    const link = await this.database()
      .getRepository(CareLinkEntity)
      .findOneBy({ patientId: req.auth.userId, status: "active" });
    if (!link)
      throw new BadRequestException("You are not currently connected to an active midwife.");
    const message = await this.database().getRepository(CareMessageEntity).save({
      id: randomUUID(),
      patientId: req.auth.userId,
      midwifeId: link.midwifeId,
      senderRole: "PREGNANT_PERSON",
      content: body.content.trim(),
      read: false,
    });
    return message;
  }

  @Get("care-team/patients/:id/messages")
  async getMidwifePatientMessages(
    @Req() req: AuthenticatedRequest,
    @Param("id") patientId: string,
  ) {
    if (req.auth.role !== "MIDWIFE")
      throw new ForbiddenException("Only midwives can access patient message threads.");
    const link = await this.database()
      .getRepository(CareLinkEntity)
      .findOneBy({ patientId, midwifeId: req.auth.userId, status: "active" });
    if (!link) throw new ForbiddenException("No active link with this patient.");
    return this.database().getRepository(CareMessageEntity).find({
      where: { patientId, midwifeId: req.auth.userId },
      order: { createdAt: "ASC" },
      take: 100,
    });
  }

  @Post("care-team/patients/:id/messages")
  async sendMidwifeMessage(
    @Req() req: AuthenticatedRequest,
    @Param("id") patientId: string,
    @Body() body: SendMessageDto,
  ) {
    if (req.auth.role !== "MIDWIFE")
      throw new ForbiddenException("Only midwives can send clinical messages through this endpoint.");
    const link = await this.database()
      .getRepository(CareLinkEntity)
      .findOneBy({ patientId, midwifeId: req.auth.userId, status: "active" });
    if (!link) throw new ForbiddenException("No active link with this patient.");
    const message = await this.database().getRepository(CareMessageEntity).save({
      id: randomUUID(),
      patientId,
      midwifeId: req.auth.userId,
      senderRole: "MIDWIFE",
      content: body.content.trim(),
      read: false,
    });
    return message;
  }
}
