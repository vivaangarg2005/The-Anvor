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

class MSG91MessageProvider {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.smsTemplateId = process.env.MSG91_OTP_TEMPLATE_ID;
    this.waIntegratedNumber = process.env.MSG91_WA_NUMBER;
    this.waTemplateName = process.env.MSG91_WA_TEMPLATE_NAME;
  }

  async sendMessage({ phone, channel, otp }) {
    if (!this.authKey) {
      throw new Error("CRITICAL CONFIGURATION ERROR: MSG91_AUTH_KEY is missing. OTP delivery is disabled.");
    }
    // MSG91 typically expects the mobile number without the '+' prefix.
    const mobile = phone.replace('+', '');

    if (channel === 'SMS') {
      if (!this.smsTemplateId) {
        throw new Error("CRITICAL: MSG91_OTP_TEMPLATE_ID is required for SMS delivery.");
      }

      // MSG91 Send OTP API
      const url = `https://control.msg91.com/api/v5/otp?template_id=${this.smsTemplateId}&mobile=${mobile}&authkey=${this.authKey}&otp=${otp}`;
      
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();

      if (data.type === 'error') {
        throw new Error(`MSG91 SMS Error: ${data.message || 'Unknown error'}`);
      }

      return { success: true, messageId: data.message };
    } 
    
    if (channel === 'WHATSAPP') {
      if (!this.waIntegratedNumber || !this.waTemplateName) {
        throw new Error("CRITICAL: MSG91_WA_NUMBER and MSG91_WA_TEMPLATE_NAME are required for WhatsApp delivery.");
      }

      // MSG91 WhatsApp Outbound Message API
      const url = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';
      const payload = {
        integrated_number: this.waIntegratedNumber,
        content_type: 'template',
        payload: {
          to: mobile,
          type: 'template',
          template: {
            name: this.waTemplateName,
            language: {
              code: 'en',
              policy: 'deterministic'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: otp }
                ]
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [
                  { type: 'text', text: otp }
                ]
              }
            ]
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'authkey': this.authKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.hasError) {
        throw new Error(`MSG91 WhatsApp Error: ${data.message || 'Unknown error'}`);
      }

      return { success: true, messageId: data.message };
    }

    throw new Error(`Unsupported channel: ${channel}`);
  }
}

// Determine which provider to use based on environment
let provider;

// In both development and production, if they have explicitly provided the MSG91 auth key, use it. 
// Otherwise gracefully fallback to Development mode so it works without keys!
if (process.env.MSG91_AUTH_KEY) {
  provider = new MSG91MessageProvider();
} else {
  console.warn("WARNING: Starting DevelopmentMessageProvider (No MSG91 Auth Key found). OTPs will be printed to console.");
  provider = new DevelopmentMessageProvider();
}

module.exports = provider;
