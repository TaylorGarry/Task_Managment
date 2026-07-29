import nodemailer from 'nodemailer';
import { generateSalarySlipPdf } from './salaryPdf.service.js';

// Configure email transporter with better error handling
const createTransporter = () => {
  // Log configuration (without exposing full password)
  console.log('SMTP Configuration:', {
    host: process.env.HR_SMTP_HOST,
    port: process.env.HR_SMTP_PORT,
    secure: process.env.HR_SMTP_SECURE === 'true',
    user: process.env.HR_SMTP_USER,
    from: process.env.HR_FROM_EMAIL,
    // Don't log full password
    hasPassword: !!process.env.HR_SMTP_PASS
  });

  return nodemailer.createTransport({
    host: process.env.HR_SMTP_HOST,
    port: Number(process.env.HR_SMTP_PORT) || 587,
    secure: process.env.HR_SMTP_SECURE === 'true',
    auth: {
      user: process.env.HR_SMTP_USER,
      pass: process.env.HR_SMTP_PASS,
    },
    // Add these options for better compatibility
    tls: {
      rejectUnauthorized: false // Only for testing - remove in production
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    debug: process.env.DISABLE_CONSOLE_LOG !== 'true',
  });
};

// Verify transporter configuration
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email configuration verification failed:', error.message);
    console.error('Please check your SMTP credentials and network connection');
    return false;
  }
};

export const sendSalarySlipEmail = async (record, user, pdfBuffer) => {
  try {
    // Verify user has email
    if (!user.email) {
      throw new Error('User does not have an email address registered');
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const monthName = monthNames[record.month - 1] || record.month;
    const subject = `Salary Slip - ${monthName} ${record.year}`;
    
    // Email HTML content with better styling
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
          .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; }
          .header h2 { margin: 0; font-weight: 600; }
          .header p { margin: 5px 0 0; opacity: 0.9; }
          .content { padding: 30px 20px; background-color: white; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          .details { background-color: #f3f4f6; padding: 15px 20px; border-radius: 6px; margin: 20px 0; }
          .details p { margin: 8px 0; }
          .label { font-weight: 600; color: #374151; }
          .highlight { background-color: #eff6ff; padding: 12px 16px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0; }
          .footer { margin-top: 25px; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; }
          .company-name { font-weight: 600; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📄 Salary Slip</h2>
            <p>${monthName} ${record.year}</p>
          </div>
          <div class="content">
            <div class="greeting">
              Dear <strong>${user.realName || user.username || 'Employee'}</strong>,
            </div>
            
            <p>Please find attached your salary slip for the month of <strong>${monthName} ${record.year}</strong>.</p>
            
            <div class="details">
              <p><span class="label">👤 Employee:</span> ${record.employeeName}</p>
              <p><span class="label">🆔 Employee Code:</span> ${record.employeeCode}</p>
              <p><span class="label">🏢 Department:</span> ${record.department || 'N/A'}</p>
              <p><span class="label">💼 Designation:</span> ${record.designation || 'N/A'}</p>
              <p><span class="label">📧 Email:</span> ${user.email}</p>
            </div>
            
            <div class="highlight">
              <p style="margin: 0;"><strong>ℹ️ Note:</strong> This is a system-generated salary slip. For any discrepancies, please contact the HR/Accounts department.</p>
            </div>
            
            <p style="margin-top: 20px;">Thank you,<br>
            <span class="company-name">HR/Accounts Department</span></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create transporter for each send to ensure fresh connection
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.HR_FROM_EMAIL || process.env.HR_SMTP_USER,
      to: user.email,
      subject: subject,
      html: html,
      attachments: [
        {
          filename: `salary-slip-${record.employeeCode}-${record.year}-${String(record.month).padStart(2, '0')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Send email with retry logic
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully (attempt ${attempt}):`, info.messageId);
        return { 
          success: true, 
          messageId: info.messageId,
          sentTo: user.email,
          attempt: attempt
        };
      } catch (error) {
        lastError = error;
        console.error(`❌ Email send attempt ${attempt} failed:`, error.message);
        
        // If it's an authentication error, don't retry
        if (error.code === 'EAUTH' || error.responseCode === 535) {
          console.error('Authentication failed. Please check your SMTP credentials.');
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < 3) {
          const waitTime = attempt * 2000;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error('Failed to send email after multiple attempts');
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const sendBulkSalarySlipsEmail = async (records, usersMap) => {
  const results = {
    success: [],
    failed: []
  };

  // Send in batches to avoid overwhelming the server
  const BATCH_SIZE = 10;
  const batches = [];
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE));
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (const batch of batches) {
    const promises = batch.map(async (record) => {
      try {
        const user = usersMap.get(record.employeeId?.toString()) || 
                     usersMap.get(record.employeeCode);
        
        if (!user) {
          results.failed.push({
            recordId: record._id,
            employeeName: record.employeeName,
            employeeCode: record.employeeCode,
            reason: 'User not found in system'
          });
          totalFailed++;
          return;
        }

        if (!user.email) {
          results.failed.push({
            recordId: record._id,
            employeeName: record.employeeName,
            employeeCode: record.employeeCode,
            reason: 'User has no email address'
          });
          totalFailed++;
          return;
        }

        const pdfBuffer = await generateSalarySlipPdf(record);
        const result = await sendSalarySlipEmail(record, user, pdfBuffer);
        
        if (result.success) {
          results.success.push({
            recordId: record._id,
            employeeName: record.employeeName,
            employeeCode: record.employeeCode,
            email: user.email,
            messageId: result.messageId
          });
          totalSent++;
        } else {
          results.failed.push({
            recordId: record._id,
            employeeName: record.employeeName,
            employeeCode: record.employeeCode,
            reason: 'Failed to send email'
          });
          totalFailed++;
        }
      } catch (error) {
        results.failed.push({
          recordId: record._id,
          employeeName: record.employeeName,
          employeeCode: record.employeeCode,
          reason: error.message
        });
        totalFailed++;
      }
    });

    // Wait for current batch to complete before sending next batch
    await Promise.all(promises);
    
    // Add a small delay between batches
    if (batches.length > 1) {
      console.log(`Batch complete. Sent: ${totalSent}, Failed: ${totalFailed}. Waiting before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`✅ Bulk sending completed. Success: ${results.success.length}, Failed: ${results.failed.length}`);
  return results;
};