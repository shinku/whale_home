import { getApiHost } from "@/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  const url = getApiHost() + "api/lisence/hehe";
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": request.headers.get("x-user-id") || "",
        Authorization: request.headers.get("Authorization") || "",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Lisence fetch failed with status:", res.status);
      return NextResponse.json(
        { error: "Failed to fetch lisence" },
        { status: res.status },
      );
    }

    return NextResponse.json(await res.json());
  } catch (error) {
    console.error("Lisence fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
