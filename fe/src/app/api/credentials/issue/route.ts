import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { subject_address, claims } = body;
    
    console.log('Attempting to issue credential for:', subject_address);
    console.log('With claims:', claims);

    // Validate inputs
    if (!subject_address) {
      return NextResponse.json(
        { error: 'Subject address is required' },
        { status: 400 }
      );
    }
    
    if (!claims) {
      return NextResponse.json(
        { error: 'Claims are required' },
        { status: 400 }
      );
    }
    
    // Make request to the Humanity Protocol API
    const response = await fetch('https://issuer.humanity.org/credentials/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': process.env.HUMANITY_API_KEY || '',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        subject_address,
        claims: {
          kyc: "passed",
          age: 22,
          custom_claim: "value"
        }
      })
    });
    
    // Log the response status
    console.log('API Response Status:', response.status);
    
    // Get the response
    const data = await response.json();
    console.log('API Response Data:', data);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}: ${JSON.stringify(data)}`);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Detailed error issuing credential:', error);
    return NextResponse.json(
      { error: 'Failed to issue credential' },
      { status: 500 }
    );
  }
} 