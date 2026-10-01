import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

export async function GET(request: Request) {
  await authService.signOut();
  const url = new URL('/login', request.url);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  await authService.signOut();
  const url = new URL('/login', request.url);
  return NextResponse.redirect(url);
}
