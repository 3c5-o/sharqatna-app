const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');

initializeApp();

const oneSignalApiKey = defineSecret('ONESIGNAL_API_KEY');
const ONE_SIGNAL_APP_ID = '017ed702-163e-41f6-9dbc-50e2aa29c926';

exports.deliverQueuedPush = onDocumentCreated(
  { document: 'pushQueue/{messageId}', secrets: [oneSignalApiKey], region: 'europe-west1' },
  async event => {
    const snapshot = event.data;
    if (!snapshot) return;
    const message = snapshot.data();
    if (message.status !== 'pending') return;

    const payload = {
      app_id: ONE_SIGNAL_APP_ID,
      target_channel: 'push',
      headings: { ar: message.title, en: message.title },
      contents: { ar: message.body, en: message.body }
    };
    if (message.externalId) payload.include_aliases = { external_id: [message.externalId] };
    else payload.included_segments = ['Subscribed Users'];

    try {
      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${oneSignalApiKey.value()}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(result));
      await snapshot.ref.update({ status: 'sent', oneSignalId: result.id || null, sentAt: FieldValue.serverTimestamp() });
    } catch (error) {
      await snapshot.ref.update({ status: 'failed', error: String(error.message).slice(0, 500), failedAt: FieldValue.serverTimestamp() });
      throw error;
    }
  }
);
