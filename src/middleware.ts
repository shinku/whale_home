import { NextResponse } from "next/server"
export function middleware() {
  // Middleware logic can be added here
  return NextResponse.next()
}