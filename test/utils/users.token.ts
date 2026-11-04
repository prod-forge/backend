import { JwtService } from '@nestjs/jwt';

const EXISTED_USER_ID = 'eebecb59-f301-4869-87ed-6af566412666';
const OTHER_USER_ID = 'd1a647fb-fd6b-4076-b629-b0dfd0aa213f';

const issueToken = (userId: string): string =>
  new JwtService({
    secret: process.env.JWT_SECRET,
    signOptions: { algorithm: 'HS256', expiresIn: 3600 },
  }).sign({}, { subject: userId });

export const existedUserToken = issueToken(EXISTED_USER_ID);
export const otherUserToken = issueToken(OTHER_USER_ID);
