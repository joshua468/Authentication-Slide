import { getCurrentUserSafe, jsonSuccess, handleAuthError } from "@/lib/auth/api";

export async function GET() {
  try {
    const user = await getCurrentUserSafe();
    return jsonSuccess({ user });
  } catch (error) {
    return handleAuthError(error);
  }
}