import { jsonSuccess, handleAuthError } from "@/lib/auth/api";
import { destroySession } from "@/features/auth/services/session";

export async function POST() {
  try {
    await destroySession();
    return jsonSuccess({ message: "Signed out." });
  } catch (error) {
    return handleAuthError(error);
  }
}