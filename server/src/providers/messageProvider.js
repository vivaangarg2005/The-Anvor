/**
 * messageProvider.js
 * Interface for delivering OTPs via different channels (SMS, WhatsApp).
 */

class DevelopmentMessageProvider {
  /**
   * Logs the OTP to the backend terminal instead of sending a real message.
   * NEVER returns the OTP to the caller (API response).
   */
  async sendMessage({ phone, channel, otp }) {
    console.log(`\n=========================================`);
    console.log(`🔒 [DEV MODE OTP]`);
    console.log(`Channel : ${channel}`);
    console.log(`To      : ${phone}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`=========================================\n`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, messageId: `dev-${Date.now()}` };
  }
}

// In the future, you can implement Production providers:
// class TwilioSmsProvider { ... }
// class GupshupWhatsAppProvider { ... }

// Determine which provider to use based on environment
let provider;

if (process.env.NODE_ENV === 'production') {
  console.warn("WARNING: No production message provider configured. Falling back to Dev Provider.");
  provider = new DevelopmentMessageProvider();
} else {
  provider = new DevelopmentMessageProvider();
}

module.exports = provider;
