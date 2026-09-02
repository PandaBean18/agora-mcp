import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let instance: Razorpay | null = null;

export function getRazorpay() {
  if (!instance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing. Razorpay will operate in mock mode.');
    } else {
      instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
  }
  return instance;
}

export async function createPaymentLink(amountCents: number, description: string, referenceId: string) {
  const rzp = getRazorpay();
  if (!rzp) {
    return {
      id: `plink_mock_${referenceId.slice(0,6)}`,
      short_url: 'https://rzp.io/i/mock',
      status: 'created'
    };
  }

  try {
    const paymentLink = await rzp.paymentLink.create({
      amount: amountCents,
      currency: 'INR',
      accept_partial: false,
      description: description,
      reference_id: referenceId,
      customer: {
        name: 'Agora AI Agent',
        email: 'agent@agoramcp.network',
        contact: '+919876543210'
      },
      notify: { sms: false, email: false },
      reminder_enable: false,
    });
    return paymentLink;
  } catch (error) {
    console.error('Razorpay Error:', error);
    throw new Error('Failed to create Razorpay Payment Link');
  }
}
