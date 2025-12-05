const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Convierte base64 url a Uint8Array (requerido por pushManager)
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registra el Service Worker y se suscribe a las notificaciones push.
 *
 * @param {Object} params
 * @param {string} params.apiBaseUrl -
 * @param {string} params.orgId
 * @param {string} params.principalId
 * @param {string} [params.token]
 */
export async function registerWebPush({
  apiBaseUrl,
  orgId,
  principalId,
  token,
}) {
  try {
    if (!("serviceWorker" in navigator)) {
      console.warn("⚠️ Service Workers no soportados en este navegador");
      return;
    }

    if (!("PushManager" in window)) {
      console.warn("⚠️ PushManager no soportado en este navegador");
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn("⚠️ VITE_VAPID_PUBLIC_KEY no definida en el frontend");
      return;
    }

    console.log("📦 Registrando Service Worker...");
    const registration = await navigator.serviceWorker.register("/sw.js");

    console.log("✅ Service Worker registrado:", registration);

    // Pedimos permiso de notificaciones
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("⚠️ Permiso de notificaciones no concedido:", permission);
      return;
    }

    // Creamos la suscripción
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log("✅ Suscripción creada:", sub);

    // Enviar la suscripción a tu backend
    const body = {
      orgId,
      principalId,
      subscription: sub,
    };

    const headers = {
      "Content-Type": "application/json",
      "x-org-id": orgId,
      "x-principal-id": principalId,
    };

    // 🔐 Construcción robusta del Authorization
    if (token) {
      const tokenStr = String(token);
      const finalToken = tokenStr.startsWith("Bearer ")
        ? tokenStr
        : `Bearer ${tokenStr}`;

      console.log("🎫 Enviando Authorization en WebPush =>", finalToken);

      headers["Authorization"] = finalToken;
    } else {
      console.warn("⚠️ registerWebPush llamado SIN token, no se enviará Authorization");
    }

    const resp = await fetch(`${apiBaseUrl}/notifications/subscriptions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("❌ Error guardando suscripción:", data);
      return;
    }

    console.log("✅ Suscripción registrada en el backend:", data);
  } catch (err) {
    console.error("❌ Error en registerWebPush:", err);
  }
}

/**
 * Elimina las suscripciones de un principal (opcional, para logout).
 */
export async function unregisterWebPush({
  apiBaseUrl,
  orgId,
  principalId,
  token,
}) {
  try {
    const headers = {
      "Content-Type": "application/json",
      "x-org-id": orgId,
      "x-principal-id": principalId,
    };

    if (token) {
      const tokenStr = String(token);
      const finalToken = tokenStr.startsWith("Bearer ")
        ? tokenStr
        : `Bearer ${tokenStr}`;

      console.log("🎫 Enviando Authorization en unregisterWebPush =>", finalToken);

      headers["Authorization"] = finalToken;
    }

    const resp = await fetch(`${apiBaseUrl}/notifications/subscriptions`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ orgId, principalId }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("❌ Error eliminando suscripciones:", data);
      return;
    }

    console.log("🧹 Suscripciones eliminadas:", data);
  } catch (err) {
    console.error("❌ Error en unregisterWebPush:", err);
  }
}
