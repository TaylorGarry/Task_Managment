const stripJsonFence = (value = "") =>
  String(value || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const AI_FRIENDLY_UNAVAILABLE_MESSAGE =
  "AI service is temporarily unavailable because the AI usage limit has been reached. Please try again later.";

class AiProviderError extends Error {
  constructor(message, { code = "AI_PROVIDER_ERROR", status = 500, safeMessage = AI_FRIENDLY_UNAVAILABLE_MESSAGE, retryable = false, cause = null } = {}) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
    this.status = status;
    this.safeMessage = safeMessage;
    this.retryable = retryable;
    if (cause) this.cause = cause;
  }
}

const parseJsonResponse = (text = "") => {
  const cleaned = stripJsonFence(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("AI provider returned invalid JSON.");
  }
};

const getProviderConfig = () => {
  const provider = String(process.env.AI_PROVIDER || "gemini").trim().toLowerCase();
  const model = String(process.env.AI_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash").trim();
  const apiKey = String(process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
  return { provider, model, apiKey };
};

const getRateLimitConfig = () => ({
  windowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60_000),
  perUserLimit: Number(process.env.AI_RATE_LIMIT_PER_USER || 8),
  globalLimit: Number(process.env.AI_RATE_LIMIT_GLOBAL || 40),
  maxRetryAttempts: Number(process.env.AI_GEMINI_MAX_RETRIES || 2),
});

const rateLimitState = {
  global: [],
  perUser: new Map(),
};

const cleanupRateWindow = (timestamps, cutoff) => timestamps.filter((timestamp) => timestamp > cutoff);

const assertGeminiRateLimit = ({ userId }) => {
  const { windowMs, perUserLimit, globalLimit } = getRateLimitConfig();
  const now = Date.now();
  const cutoff = now - windowMs;

  rateLimitState.global = cleanupRateWindow(rateLimitState.global, cutoff);

  const normalizedUserId = String(userId || "anonymous").trim() || "anonymous";
  const userTimestamps = cleanupRateWindow(rateLimitState.perUser.get(normalizedUserId) || [], cutoff);
  rateLimitState.perUser.set(normalizedUserId, userTimestamps);

  if (rateLimitState.global.length >= globalLimit) {
    throw new AiProviderError(
      `Gemini global rate limit exceeded (${globalLimit}/${windowMs}ms).`,
      {
        code: "AI_RATE_LIMIT_EXCEEDED",
        status: 429,
        safeMessage: AI_FRIENDLY_UNAVAILABLE_MESSAGE,
      }
    );
  }

  if (userTimestamps.length >= perUserLimit) {
    throw new AiProviderError(
      `Gemini per-user rate limit exceeded for ${normalizedUserId} (${perUserLimit}/${windowMs}ms).`,
      {
        code: "AI_RATE_LIMIT_EXCEEDED",
        status: 429,
        safeMessage: AI_FRIENDLY_UNAVAILABLE_MESSAGE,
      }
    );
  }

  rateLimitState.global.push(now);
  userTimestamps.push(now);
  rateLimitState.perUser.set(normalizedUserId, userTimestamps);
};

const isGeminiQuotaError = (status, errorText = "") =>
  Number(status) === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(String(errorText || ""));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGemini = async ({ prompt, responseJson = false, userId }) => {
  const { model, apiKey } = getProviderConfig();
  if (!apiKey) throw new Error("AI provider is not configured.");

  const { maxRetryAttempts } = getRateLimitConfig();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetryAttempts) {
    assertGeminiRateLimit({ userId });
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: responseJson ? 0.1 : 0.3,
            ...(responseJson ? { responseMimeType: "application/json" } : {}),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        if (isGeminiQuotaError(response.status, errorText)) {
          lastError = new AiProviderError(
            `Gemini quota exhausted (${response.status}). ${errorText.slice(0, 300)}`,
            {
              code: "AI_QUOTA_EXHAUSTED",
              status: 429,
              safeMessage: AI_FRIENDLY_UNAVAILABLE_MESSAGE,
              retryable: attempt < maxRetryAttempts,
            }
          );
          if (attempt < maxRetryAttempts) {
            const delay = 250 * 2 ** attempt;
            attempt += 1;
            await sleep(delay);
            continue;
          }
          throw lastError;
        }

        throw new AiProviderError(
          `Gemini request failed (${response.status}): ${errorText.slice(0, 300)}`,
          {
            code: "AI_PROVIDER_ERROR",
            status: response.status,
            safeMessage: "AI service is temporarily unavailable. Please try again later.",
          }
        );
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
      if (!text) {
        throw new AiProviderError("AI provider returned an empty response.", {
          code: "AI_PROVIDER_ERROR",
          status: 502,
          safeMessage: "AI service is temporarily unavailable. Please try again later.",
        });
      }
      return text;
    } catch (error) {
      if (error instanceof AiProviderError) {
        lastError = error;
        if (error.code === "AI_QUOTA_EXHAUSTED" || error.code === "AI_RATE_LIMIT_EXCEEDED") {
          throw error;
        }
        throw error;
      }

      lastError = new AiProviderError(error?.message || "AI provider request failed.", {
        code: "AI_PROVIDER_ERROR",
        status: 500,
        safeMessage: "AI service is temporarily unavailable. Please try again later.",
        cause: error,
      });
      throw lastError;
    }
  }

  throw lastError || new AiProviderError("AI provider request failed.", {
    code: "AI_PROVIDER_ERROR",
    status: 500,
    safeMessage: "AI service is temporarily unavailable. Please try again later.",
  });
};

const buildPrompt = ({ systemPrompt, userMessage, context, conversation }) =>
  [
    systemPrompt,
    conversation?.length
      ? `Recent conversation:\n${JSON.stringify(conversation, null, 2)}`
      : "",
    context ? `Context:\n${JSON.stringify(context, null, 2)}` : "",
    `User message:\n${userMessage}`,
  ]
    .filter(Boolean)
    .join("\n\n");

export const generateToolCall = async ({ systemPrompt, userMessage, context, conversation }) => {
  const { provider } = getProviderConfig();
  if (provider !== "gemini") {
    throw new Error(`Unsupported AI_PROVIDER "${provider}".`);
  }

  const text = await callGemini({
    responseJson: true,
    userId: context?.authenticatedUser?.id,
    prompt: buildPrompt({ systemPrompt, userMessage, context, conversation }),
  });
  return parseJsonResponse(text);
};

export const generateResponse = async ({ systemPrompt, toolResult, conversation, context }) => {
  const { provider } = getProviderConfig();
  if (provider !== "gemini") {
    throw new Error(`Unsupported AI_PROVIDER "${provider}".`);
  }

  return callGemini({
    responseJson: false,
    userId: context?.authenticatedUser?.id,
    prompt: buildPrompt({
      systemPrompt,
      userMessage: `Tool result:\n${JSON.stringify(toolResult, null, 2)}`,
      context,
      conversation,
    }),
  });
};

export { AiProviderError, AI_FRIENDLY_UNAVAILABLE_MESSAGE };
