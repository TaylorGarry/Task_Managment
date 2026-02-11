self.addEventListener("push", (event) => {
  let payload = {
    title: "FDMS – Shift Alert",
    body: "80% of your shift time has passed.",
    icon: "/logo.png",
    badge: "/badge.png",
    tag: "shift-alert"
  };

  if (event.data) {
    const text = event.data.text();

    try {
      const parsed = JSON.parse(text);

      payload = {
        ...payload,
        ...parsed
      };

    } catch (err) {
      payload.body = text;
    }
  }
const url =
  payload.url ||
  (self.location.hostname === "localhost"
    ? "http://localhost:5173/#/dashboard"
    : "https://crm.fdbs.in/#/dashboard");


  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      data: { url }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {

        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }

        return clients.openWindow(url);
      })
  );
});
