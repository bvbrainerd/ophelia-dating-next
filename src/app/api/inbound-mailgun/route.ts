export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const sender = formData.get('sender'); // sender email
        const subject = formData.get('subject'); // email subject
        const bodyPlain = formData.get('body-plain'); // plain text body
        const to = formData.get('recipient'); // receiving address (e.g. reply@...)

        console.log("Inbound email received from:", sender);
        console.log("Subject:", subject);
        console.log("Message:", bodyPlain);

        // You can now parse and react to the message — e.g. update a date request status, notify a user, etc.

        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error('Inbound email handler error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}