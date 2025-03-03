import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Constants for validation
const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 500000; // 500k characters

// Rate limiting (simple in-memory implementation)
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const ipRequests = new Map<string, { count: number, timestamp: number }>();

// Validate email format
const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

// Validate all inputs
const validateEmailData = (data: any) => {
  const errors: string[] = [];
  
  // Check required fields exist
  if (!data.subject) errors.push('Subject is required');
  if (!data.sender) errors.push('Sender is required');
  if (!data.recipients || !Array.isArray(data.recipients) || data.recipients.length === 0) {
    errors.push('At least one recipient is required');
  }
  if (!data.body) errors.push('Email body is required');
  
  // If missing required fields, return early
  if (errors.length > 0) return { valid: false, errors };
  
  // Validate email formats
  if (!isValidEmail(data.sender)) errors.push('Sender email format is invalid');
  
  // Validate recipients
  if (Array.isArray(data.recipients)) {
    const invalidRecipients = data.recipients.filter((email: string) => !isValidEmail(email));
    if (invalidRecipients.length > 0) {
      errors.push(`Invalid recipient email format: ${invalidRecipients.join(', ')}`);
    }
  }
  
  // Validate CC if present
  if (Array.isArray(data.cc) && data.cc.length > 0) {
    const invalidCc = data.cc.filter((email: string) => !isValidEmail(email));
    if (invalidCc.length > 0) {
      errors.push(`Invalid CC email format: ${invalidCc.join(', ')}`);
    }
  }
  
  // Validate BCC if present
  if (Array.isArray(data.bcc) && data.bcc.length > 0) {
    const invalidBcc = data.bcc.filter((email: string) => !isValidEmail(email));
    if (invalidBcc.length > 0) {
      errors.push(`Invalid BCC email format: ${invalidBcc.join(', ')}`);
    }
  }
  
  // Validate content length
  if (data.subject.length > MAX_SUBJECT_LENGTH) {
    errors.push(`Subject exceeds maximum length of ${MAX_SUBJECT_LENGTH} characters`);
  }
  
  if (data.body.length > MAX_BODY_LENGTH) {
    errors.push(`Email body exceeds maximum length of ${MAX_BODY_LENGTH} characters`);
  }
  
  return { 
    valid: errors.length === 0,
    errors
  };
};

// Check rate limit for an IP
const checkRateLimit = (ip: string): { allowed: boolean, message?: string } => {
  const now = Date.now();
  const requestData = ipRequests.get(ip);
  
  if (!requestData) {
    // First request from this IP
    ipRequests.set(ip, { count: 1, timestamp: now });
    return { allowed: true };
  }
  
  // Check if we're in the same time window
  if (now - requestData.timestamp > RATE_LIMIT_WINDOW) {
    // Reset for new window
    ipRequests.set(ip, { count: 1, timestamp: now });
    return { allowed: true };
  }
  
  // We're in the same time window, check count
  if (requestData.count >= RATE_LIMIT) {
    return { 
      allowed: false, 
      message: `Rate limit exceeded. Maximum ${RATE_LIMIT} requests per minute.`
    };
  }
  
  // Increment count
  ipRequests.set(ip, { 
    count: requestData.count + 1, 
    timestamp: requestData.timestamp 
  });
  
  return { allowed: true };
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    const rateLimitCheck = checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.message },
        { status: 429 } // Too Many Requests
      );
    }
    
    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 } // Unsupported Media Type
      );
    }
    
    // Create Supabase server client
    const supabase = await createClient();
    
    // In a real production environment, you'd want to keep this authentication check
    // But for development, we can bypass it
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      // Only check authentication in production
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized: Authentication required' },
          { status: 401 }
        );
      }
    }
    
    // Parse request body with size limit check
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate email data
    const validation = validateEmailData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }
    
    const { subject, sender, recipients, cc, bcc } = body;
    
    // Ensure recipients is an array
    const recipientsArray = Array.isArray(recipients) ? recipients : [recipients];
    
    // Insert email data into the emails table
    const { data, error } = await supabase
      .from('emails')
      .insert({
        subject,
        sender,
        recipient: recipientsArray,
        cc: cc || [],
        bcc: bcc || [],
        body: body.body // Using body.body to avoid confusion with the request body
      })
      .select('id');
    
    if (error) {
      console.error('Error storing email:', error);
      return NextResponse.json(
        { error: 'Failed to store email data', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email data stored successfully',
      emailId: data[0].id
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
