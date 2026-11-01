export const AuthHttpHeader = {
  AUTHORIZATION: 'authorization',
} as const;

export const AuthBearerScheme = {
  PREFIX: 'Bearer ',
} as const;

export const AuthRequestKey = {
  USER: 'authUser',
} as const;

export type AuthenticatedRequestUser = {
  userId: string;
};
