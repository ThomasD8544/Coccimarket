import webpush from 'web-push';

let configured = false;

export function configurePush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return false;

  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }

  return true;
}

export async function sendPush(subscription: webpush.PushSubscription, payload: unknown) {
  if (!configurePush()) return;

  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
