import { ApiRoute } from '../enums/api-route.enum'
import type { SignedInUser } from '../context/SignedInContext'
import { apiPost } from './client'

export interface SignupRequest {
  email: string
  name: string
  password: string
}

export interface SignupSuccessResponse {
  message: string
  user: SignedInUser
}

export async function signupUser(
  payload: SignupRequest,
): Promise<SignupSuccessResponse> {
  return apiPost<SignupSuccessResponse>(ApiRoute.USERS_SIGNUP, payload)
}
