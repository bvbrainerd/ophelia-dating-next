import FormData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(FormData);

export const mg = mailgun.client({
    username: 'api',
    key: process.env.NEW_MAILGUN_API_KEY!,
});