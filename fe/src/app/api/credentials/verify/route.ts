import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('Attempting to verify credential');

    const response = await fetch('https://issuer.humanity.org/credentials/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': process.env.HUMANITY_API_KEY || '',
        'Accept': '*/*'
      },
      body: JSON.stringify(body)
    });
    
    console.log('Verification API Response Status:', response.status);
    
    const data = await response.json();
    console.log('Verification API Response:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error verifying credential:', error);
    return NextResponse.json(
      { error: 'Failed to verify credential' },
      { status: 500 }
    );
  }
} 