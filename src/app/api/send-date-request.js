import { createTransport } from 'nodemailer';
import { supabase } from '../../../lib/supabaseClient'; // Adjust import path as needed

// Define email templates at the top of the file
const getEmailSubject = (senderName) => `New Date Request from ${senderName}`;

const getEmailHtml = (senderName, venue, proposedTime, splitPayment) => `
  <h1>New Date Request</h1>
  <p>${senderName} would like to go on a date with you!</p>
  <p>Venue: ${venue}</p>
  <p>Proposed Time: ${proposedTime}</p>
  <p>Payment: ${splitPayment ? 'Split the Ophelia fee' : 'Full fee covered by sender'}</p>
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { senderId, receiverId, venue, proposedTime, splitPayment } = req.body;

    // Get sender's details
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', senderId)
      .single();

    // Get receiver's details
    const { data: receiverProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', receiverId)
      .single();

    // Define email content here, before using it
    const emailSubject = `New Date Request from ${senderProfile.first_name}`;
    const emailHtml = `
      <h1>You have a new date request!</h1>
      <p>${senderProfile.first_name} would like to go on a date with you at ${venue}.</p>
      <p>Proposed time: ${new Date(proposedTime).toLocaleString()}</p>
      <p>Dating style: ${splitPayment ? 'Split the Ophelia fee' : 'Full fee covered by sender'}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View Request</a>
    `;

    // Create the date request
    const { data: dateRequest, error: dateRequestError } = await supabase
      .from('date_requests')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          venue,
          proposed_time: proposedTime,
          split_payment: splitPayment,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (dateRequestError) {
      throw dateRequestError;
    }

    // Send email notification
    const msg = {
      to: receiverProfile.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: emailSubject,
      html: emailHtml,
    };

    // ... rest of the code ...
  } catch (error) {
    console.error('Error processing date request:', error);
    return res.status(500).json({ error: 'Failed to process date request' });
  }
}