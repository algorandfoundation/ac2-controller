// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  AC2Attachment,
  AC2AttachmentData,
  AC2BaseMessage,
  AC2KeyRequest,
  AC2KeyResponse,
  AC2Message,
  AC2MessageType,
  AC2SessionClose,
  AC2SessionEstablish,
  AC2SigningRejected,
  AC2SigningRequest,
  AC2SigningResponse,
  AC2StreamChunk,
  AC2StreamEnd,
  AC2StreamRequest,
  DecodeResult,
  KeyEncoding,
  KeyRequestBody,
  KeyResponseBody,
  KeyType,
  SessionCloseBody,
  SessionEstablishBody,
  SigningEncoding,
  SigningRejectedBody,
  SigningRequestBody,
  SigningResponseBody,
  StreamChunkBody,
  StreamEndBody,
  StreamRequestBody,
  StreamUsage,
  ValidationResult,
} from "./types.js";

export { AC2MessageTypes } from "./types.js";

// ─── Validator ────────────────────────────────────────────────────────────────
export { validate, validateBody, validateMessage } from "./validator.js";

// ─── Decoder + Type Guards ────────────────────────────────────────────────────
export {
  decode,
  handleMessage,
  isKeyRequest,
  isKeyResponse,
  isSessionClose,
  isSessionEstablish,
  isSigningRejected,
  isSigningRequest,
  isSigningResponse,
  isStreamChunk,
  isStreamEnd,
  isStreamRequest,
} from "./decoder.js";

export type { MessageHandlers } from "./decoder.js";

// ─── Schemas (for consumers that need to extend or inspect) ───────────────────
export { baseMessageSchema } from "./schemas/base.js";
export { keyRequestBodySchema, keyResponseBodySchema } from "./schemas/key.js";
export { sessionCloseBodySchema, sessionEstablishBodySchema } from "./schemas/session.js";
export {
  signingRejectedBodySchema,
  signingRequestBodySchema,
  signingResponseBodySchema,
} from "./schemas/signing.js";
export {
  streamChunkBodySchema,
  streamEndBodySchema,
  streamRequestBodySchema,
} from "./schemas/streaming.js";
