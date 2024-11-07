// app/api/date-requests/[id]/route.ts
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Here you would update your database with the payment status
    // For now, we'll just return success
    return NextResponse.json({ 
      success: true,
      message: 'Date status updated successfully'
    });
  } catch (error) {
    console.error('Error updating date request:', error);
    return NextResponse.json(
      { error: 'Failed to update date request' },
      { status: 500 }
    );
  }
}