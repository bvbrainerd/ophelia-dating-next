import { createTransport } from 'nodemailer';
import { supabase } from '../../../lib/supabaseClient'; // Adjust import path as needed

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { senderId, recipientId, dateDetails } = req.body;
  let emailLogId = null;

  try {
    const { data: senderData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', senderId)
      .single();

    const { data: recipientData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', recipientId)
      .single();

    const transporter = createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD,
      },
    });

    const { data: emailLogData, error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient_id: recipientId,
        sender_id: senderId,
        email_type: 'date_request',
        request_id: dateDetails.requestId,
        status: 'pending',
      })
      .select()
      .single();

    if (logError) throw new Error(`Failed to log email attempt: ${logError.message}`);

    emailLogId = emailLogData.id;

    const APP_URL = 'https://opheliadating.com';

    const emailHtml = `
      <div style="
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #cc0000; 
        color: white; 
        font-family: Arial, sans-serif; 
        text-align: center; 
        padding: 20px;
        border-radius: 10px;
      ">
        <h1>You Have a New Date Request!</h1>
        
        <p><strong>From:</strong> ${senderData.first_name} ${senderData.last_name}</p>
        
        <p><strong>Venue:</strong> ${dateDetails.venue}</p>
        
        <p><strong>Proposed Time:</strong> ${new Date(dateDetails.proposedTime).toLocaleString()}</p>
        
        ${
          dateDetails.proposedPayment
            ? `<p><strong>Proposed Payment:</strong> $${dateDetails.proposedPayment}</p>`
            : ''
        }
        
        <a href="${APP_URL}" style="
          display: inline-block;
          background-color: white;
          color: #cc0000;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 15px;
        ">View Request</a>
      </div>
    `;

    const mailOptions = {
      from: 'noreply@opheliadating.com',
      to: recipientData.email,
      subject: 'You have a new date request!',
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    await supabase
      .from('email_logs')
      .update({ status: 'sent' })
      .eq('id', emailLogId);

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Failed to send date request email:', errorMessage);

    if (emailLogId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'error',
          error_details: {
            message: errorMessage,
            stack: errorStack,
          },
        })
        .eq('id', emailLogId);
    }

    return res.status(500).json({ error: errorMessage });
  }
}
