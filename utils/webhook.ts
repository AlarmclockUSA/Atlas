const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL || 'https://your-production-domain.com/api/elevenlabs-webhook';

async function sendWebhook(data: any) {
  try {
    console.log('Sending webhook to:', WEBHOOK_URL);
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Webhook sent successfully');
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

export { sendWebhook };

