export const CONFIG = {
  TTL_SECONDS: 60 * 60 * 24 * 7,
  RATE_LIMIT_WINDOW: 60,
  RATE_LIMIT_MAX: 10,
  MAX_BODY_SIZE: 1_000_000,
  // Feedback submissions share the RATE_LIMIT_KV namespace but use their own
  // key prefix and a separate, tighter quota so playground shares and feedback
  // do not consume each other's budget.
  FEEDBACK_RATE_LIMIT_WINDOW: 600,
  FEEDBACK_RATE_LIMIT_MAX: 5,
  FEEDBACK_MAX_ITEMS: 10,
  FEEDBACK_MIN_MESSAGE: 5,
  FEEDBACK_MAX_MESSAGE: 2000,
};
