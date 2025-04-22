const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {String} options.to - Recipient email
   * @param {String} options.subject - Email subject
   * @param {String} options.text - Plain text email content
   * @param {String} options.html - HTML email content
   */
  async sendEmail(options) {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || this._convertToHtml(options.text)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Email error:', error);
      throw error;
    }
  }

  /**
   * Convert plain text to basic HTML format
   * @param {String} text - Plain text content
   * @returns {String} HTML content
   */
  _convertToHtml(text) {
    return `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
      ${text.replace(/\n/g, '<br>')}
    </div>`;
  }

  /**
   * Send welcome email to new user
   * @param {Object} user - User object with email and username
   */
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Art Gallery!';
    const text = `Hi ${user.username},
    
Welcome to Art Gallery! We're excited to have you join our community of art enthusiasts.

You can now explore virtual exhibitions, connect with artists, and discover amazing artwork.

Get started by completing your profile and browsing our featured galleries.

Best regards,
The Art Gallery Team`;

    return this.sendEmail({
      to: user.email,
      subject,
      text
    });
  }

  /**
   * Send password reset email
   * @param {Object} user - User object with email and resetToken
   * @param {String} resetUrl - URL for password reset
   */
  async sendPasswordResetEmail(user, resetUrl) {
    const subject = 'Password Reset - Valid for 10 Minutes';
    const text = `Hi ${user.username},
    
You requested a password reset. Please click on the link below to reset your password:

${resetUrl}

If you didn't request this, please ignore this email and your password will remain unchanged.

Note: This link is only valid for 10 minutes.

Best regards,
The Art Gallery Team`;

    return this.sendEmail({
      to: user.email,
      subject,
      text
    });
  }

  /**
   * Send order confirmation email
   * @param {Object} order - Order object with details
   * @param {Object} user - User who placed the order
   */
  async sendOrderConfirmationEmail(order, user) {
    const subject = `Order Confirmation #${order._id}`;
    
    // Generate items list from order
    const itemsList = order.items.map(item => 
      `- ${item.artwork.title} by ${item.artwork.artist.name}: $${item.price.toFixed(2)}`
    ).join('\n');
    
    const text = `Hi ${user.username},
    
Thank you for your order! We're processing it now.

Order Details:
Order ID: ${order._id}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Total: $${order.totalAmount.toFixed(2)}

Items:
${itemsList}

Shipping Address:
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
${order.shippingAddress.country}

You'll receive another email when your order ships.

Best regards,
The Art Gallery Team`;

    return this.sendEmail({
      to: user.email,
      subject,
      text
    });
  }
}

module.exports = new EmailService(); 