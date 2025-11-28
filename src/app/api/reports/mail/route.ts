import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, subject, text } = body;

        if (!to || !subject || !text) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // MOCK EMAIL SENDING
        console.log('================================================');
        console.log('📧 MOCK EMAIL SENT');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('------------------------------------------------');
        console.log(text);
        console.log('================================================');

        // In a real app, use nodemailer or an external service here.

        return NextResponse.json({ success: true, message: 'Email sent (mocked)' });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
