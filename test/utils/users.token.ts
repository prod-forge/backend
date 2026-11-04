import { JwtService } from '@nestjs/jwt';

const EXISTED_USER_ID = 'eebecb59-f301-4869-87ed-6af566412666';

export const existedUserToken = new JwtService({
  secret: process.env.JWT_SECRET,
  signOptions: { algorithm: 'HS256', expiresIn: 3600 },
}).sign({}, { subject: EXISTED_USER_ID });
