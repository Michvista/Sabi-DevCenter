self.addEventListener("push", (event) => {
  let message = {
    title: "Sabi",
    body: "A gentle check-in is ready.",
    url: "/pregnant/dashboard",
  };
  try {
    if (event.data) message = { ...message, ...event.data.json() };
  } catch {
    /* use safe default */
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      icon: "/sabi-mark.svg",
      badge: "/sabi-mark.svg",
      data: { url: message.url },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(
    event.notification.data?.url ?? "/pregnant/dashboard",
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => "focus" in client);
        return existing
          ? existing.navigate(url).then((client) => client?.focus())
          : self.clients.openWindow(url);
      }),
  );
});
