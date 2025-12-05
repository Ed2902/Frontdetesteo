// src/modules/Notifications/pushService.js
import webpush from "web-push";
import PushSubscription from "./PushSubscription.js";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const mailto = process.env.VAPID_MAILTO || "mailto:soporte@appfastway.com";

if (!publicKey || !privateKey) {
  console.warn("⚠️ VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY no definidas en .env");
} else {
  webpush.setVapidDetails(mailto, publicKey, privateKey);
}

export async function sendPushToPrincipal(principalId, payload) {
  try {
    const subs = await PushSubscription.find({ principalId });

    if (!subs.length) {
      console.log("ℹ️ No hay suscripciones para este principal:", principalId);
      return;
    }

    const data = JSON.stringify(payload);

    await Promise.all(
      subs.map((sub) =>
        webpush
          .sendNotification(sub.subscription, data)
          .then(() => {
            console.log("✅ Push enviada a endpoint:", sub.subscription?.endpoint);
          })
          .catch(async (err) => {
            console.error(
              "❌ Error enviando push:",
              err?.statusCode,
              err?.body || err
            );

            // Si el endpoint está muerto, limpiamos
            if ([404, 410].includes(err?.statusCode)) {
              await PushSubscription.deleteOne({ _id: sub._id });
              console.log("🧹 Suscripción eliminada por endpoint inválido");
            }
          })
      )
    );
  } catch (err) {
    console.error("❌ Error general en sendPushToPrincipal:", err);
  }
}
