export type RedisConfigInterface = {
  redisEnabled: boolean;
  redisHost: string;
  redisPassword?: string;
  redisPort: number;
  redisTls: boolean;
};
