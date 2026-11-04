export const logRedact = {
  censor: '[REDACTED]',
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.body.password',
    'req.body.email',
    'req.body.token',
    'password',
    'token',
  ],
};
