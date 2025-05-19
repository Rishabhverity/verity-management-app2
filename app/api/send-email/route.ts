import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const subject = formData.get('subject') as string;
    const file = formData.get('file') as File;
    const message = formData.get('message') as string || 'Please find the attached attendance report.';

    if (!email || !subject || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a nodemailer transporter
    // For production, use your actual email service credentials
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Send email with attachment
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'verity-training@example.com',
      to: email,
      subject: subject,
      text: message,
      html: `<p>${message}</p>`,
      attachments: [
        {
          filename: file.name,
          content: buffer,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
