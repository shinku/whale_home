import { NextResponse } from "next/server"
export function middleware(request: Request) {
  // Middleware logic can be added here
  return NextResponse.next()
}