import { existedUserToken, otherUserToken } from './users.token';

export const authHeaders = {
  Authorization: `Bearer ${existedUserToken}`,
};

export const otherUserHeaders = {
  Authorization: `Bearer ${otherUserToken}`,
};
