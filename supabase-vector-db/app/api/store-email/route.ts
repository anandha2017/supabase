import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
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
    
    // Parse request body
    const { subject, sender, recipients, cc, bcc, body } = await request.json();
    
    // Validate required fields
    if (!subject || !sender || !recipients || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
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
        body
      })
      .select('id');
    
    if (error) {
      console.error('Error storing email:', error);
      return NextResponse.json(
        { error: 'Failed to store email data' },
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
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
