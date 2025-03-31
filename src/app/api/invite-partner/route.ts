import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: Request) {
  console.log('Starting partner invitation process');
  
  // Get environment variables and remove any quotes
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY?.replace(/['"]/g, '');
  const SENDGRID_FROM_EMAIL = 'dates@opheliadating.io';  // Use the correct from email
  const TEMPLATE_ID = process.env.SENDGRID_PARTNER_INVITATION_TEMPLATE_ID?.replace(/['"]/g, '');
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/['"]/g, '');
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/['"]/g, '');

  // Log environment variable status (safely)
  console.log('Environment variables status:', {
    hasApiKey: !!SENDGRID_API_KEY,
    fromEmail: SENDGRID_FROM_EMAIL,
    hasTemplateId: !!TEMPLATE_ID,
    hasSupabaseUrl: !!SUPABASE_URL,
    hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
    templateId: TEMPLATE_ID
  });

  // Validate SendGrid configuration
  if (!SENDGRID_API_KEY || !TEMPLATE_ID) {
    console.error('Missing SendGrid configuration:', {
      hasApiKey: !!SENDGRID_API_KEY,
      hasTemplateId: !!TEMPLATE_ID,
      templateId: TEMPLATE_ID
    });
    return NextResponse.json(
      { error: 'Email service is not properly configured' },
      { status: 500 }
    );
  }

  // Validate Supabase configuration
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase configuration:', {
      hasUrl: !!SUPABASE_URL,
      hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
    });
    return NextResponse.json(
      { error: 'Database configuration is missing' },
      { status: 500 }
    );
  }

  // Initialize SendGrid
  sgMail.setApiKey(SENDGRID_API_KEY);

  try {
    // Parse and validate request body
    const body = await request.json();
    console.log('Request body:', {
      ...body,
      userId: body.userId ? '[REDACTED]' : undefined,
      partnerEmail: body.partnerEmail ? body.partnerEmail : undefined
    });

    const { partnerEmail, userId, userName } = body;

    if (!partnerEmail || !userId || !userName) {
      console.error('Missing required fields:', { 
        hasPartnerEmail: !!partnerEmail, 
        hasUserId: !!userId, 
        hasUserName: !!userName 
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize variables
    let invitationToken = crypto.randomUUID();
    let invitationId: string | undefined;
    console.log('Generated invitation token');

    // Initialize Supabase client with additional logging
    console.log('Initializing Supabase client with URL:', SUPABASE_URL);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test Supabase connection
    try {
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        return NextResponse.json(
          { error: 'Database connection failed', details: testError.message },
          { status: 500 }
        );
      }
      console.log('Supabase connection test successful');
    } catch (testError: any) {
      console.error('Supabase connection test threw error:', testError);
      return NextResponse.json(
        { error: 'Database connection failed', details: testError.message },
        { status: 500 }
      );
    }

    // Check if an invitation already exists
    console.log('Checking for existing invitation...');
    const { data: existingInvite, error: checkError } = await supabase
      .from('couple_invitations')
      .select('*')
      .eq('inviter_id', userId)
      .eq('partner_email', partnerEmail)
      .eq('status', 'pending')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing invitation:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing invitation', details: checkError.message },
        { status: 500 }
      );
    }

    if (existingInvite) {
      console.log('Found existing invitation');
      invitationToken = existingInvite.token;
      invitationId = existingInvite.id;
    } else {
      // Store new invitation in database
      console.log('Storing new invitation in database...');
      const { data: inviteData, error: inviteError } = await supabase
        .from('couple_invitations')
        .insert([
          {
            inviter_id: userId,
            partner_email: partnerEmail,
            token: invitationToken,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (inviteError) {
        console.error('Error storing invitation:', inviteError);
        return NextResponse.json(
          { error: 'Failed to store invitation', details: inviteError.message },
          { status: 500 }
        );
      }

      console.log('Invitation stored successfully');
      invitationId = inviteData?.id;
    }

    // Prepare email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/auth/accept-invitation?token=${invitationToken}`;
    
    console.log('Preparing to send email with data:', {
      to: partnerEmail,
      fromEmail: SENDGRID_FROM_EMAIL,
      templateId: TEMPLATE_ID,
      invitationLink
    });

    const msg = {
      to: partnerEmail,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: 'Ophelia Dating'
      },
      templateId: TEMPLATE_ID,
      dynamicTemplateData: {
        inviterName: userName,
        invitationLink
      }
    };

    try {
      // Send email
      console.log('Sending email...');
      const [response] = await sgMail.send(msg);
      console.log('SendGrid response:', response);

      if (response?.statusCode !== 202) {
        console.error('Unexpected SendGrid response:', response);
        return NextResponse.json(
          { error: 'Failed to send email', details: `Status code: ${response?.statusCode}` },
          { status: 500 }
        );
      }

      console.log('Email sent successfully');
      return NextResponse.json({ 
        success: true, 
        data: { 
          invitationId,
          token: invitationToken 
        } 
      });
    } catch (emailError: any) {
      console.error('SendGrid error:', emailError);
      if (emailError.response) {
        console.error('SendGrid error details:', {
          body: emailError.response.body,
          headers: emailError.response.headers,
          status: emailError.response.status
        });
      }
      throw emailError;
    }

  } catch (error: any) {
    console.error('Error in partner invitation process:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('SendGrid error details:', {
        body: error.response.body,
        headers: error.response.headers,
        status: error.response.status
      });
    }

    // Return appropriate error response
    return NextResponse.json(
      { 
        error: 'Failed to send partner invitation', 
        details: error.message,
        type: error.name,
        code: error.code
      },
      { status: 500 }
    );
  }
} 