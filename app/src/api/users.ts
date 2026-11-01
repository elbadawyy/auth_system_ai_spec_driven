import { ApiRoute } from '../enums/api-route.enum'
import { apiPost } from './client'

export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface AuthSuccessResponse {
  message: string
  accessToken: string
  user: AuthUser
}

export type SignupSuccessResponse = AuthSuccessResponse
export type SignInSuccessResponse = AuthSuccessResponse

export interface SignupRequest {
  email: string
  name: string
  password: string
}

export interface SignInRequest {
  email: string
  password: string
}

export async function signupUser(
  payload: SignupRequest,
): Promise<SignupSuccessResponse> {
  return apiPost<SignupSuccessResponse>(ApiRoute.USERS_SIGNUP, payload)
}

export async function signInUser(
  payload: SignInRequest,
): Promise<SignInSuccessResponse> {
  return apiPost<SignInSuccessResponse>(ApiRoute.USERS_SIGNIN, payload)
}
