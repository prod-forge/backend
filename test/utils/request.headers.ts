import { existedUserToken } from './users.token';

export const authHeaders = {
  Authorization: `Bearer ${existedUserToken}`,
};
