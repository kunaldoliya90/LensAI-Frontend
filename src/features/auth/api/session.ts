import { apiRequest } from "@/lib/api/client";
import type { SessionResponse } from "@/lib/api/types";
import type { LoginInput, SignupInput } from "../schemas";

export function signup(input: SignupInput): Promise<SessionResponse> {
  return apiRequest<SessionResponse>("/portal/signup", {
    method: "POST",
    auth: "none",
    json: input,
  });
}

export function login(input: LoginInput): Promise<SessionResponse> {
  return apiRequest<SessionResponse>("/portal/login", {
    method: "POST",
    auth: "none",
    json: input,
  });
}
