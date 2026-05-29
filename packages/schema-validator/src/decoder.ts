import type {
  AC2BaseMessage,
  AC2KeyRequest,
  AC2KeyResponse,
  AC2Message,
  AC2SessionClose,
  AC2SessionEstablish,
  AC2SigningRejected,
  AC2SigningRequest,
  AC2SigningResponse,
  AC2StreamChunk,
  AC2StreamEnd,
  AC2StreamRequest,
  DecodeResult,
  ValidationResult,
} from "./types.js";
import { AC2MessageTypes } from "./types.js";
import { validate } from "./validator.js";

// ─── Decode ───────────────────────────────────────────────────────────────────

/**
 * Parse and validate an AC2 message from a raw JSON string or plain object.
 *
 * Returns both the (loosely-typed) message and its validation result.
 * Use the exported type guards (`isSigningRequest`, etc.) to narrow the type.
 *
 * @example
 * const { message, validation } = decode(rawJson);
 * if (validation.valid && isSigningRequest(message)) {
 *   console.log(message.body.operation);
 * }
 */
export function decode(raw: string | Record<string, unknown>): DecodeResult {
  let obj: unknown;

  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      const validation: ValidationResult = {
        valid: false,
        errors: ["Invalid JSON: failed to parse"],
        warnings: [],
      };
      return { message: {} as AC2Message, validation };
    }
  } else {
    obj = raw;
  }

  const validation = validate(obj);
  return { message: obj as AC2Message, validation };
}

// ─── Type Guards ──────────────────────────────────────────────────────────────

export function isSigningRequest(msg: AC2BaseMessage): msg is AC2SigningRequest {
  return msg.type === AC2MessageTypes.SIGNING_REQUEST;
}

export function isSigningResponse(msg: AC2BaseMessage): msg is AC2SigningResponse {
  return msg.type === AC2MessageTypes.SIGNING_RESPONSE;
}

export function isSigningRejected(msg: AC2BaseMessage): msg is AC2SigningRejected {
  return msg.type === AC2MessageTypes.SIGNING_REJECTED;
}

export function isKeyRequest(msg: AC2BaseMessage): msg is AC2KeyRequest {
  return msg.type === AC2MessageTypes.KEY_REQUEST;
}

export function isKeyResponse(msg: AC2BaseMessage): msg is AC2KeyResponse {
  return msg.type === AC2MessageTypes.KEY_RESPONSE;
}

export function isSessionEstablish(msg: AC2BaseMessage): msg is AC2SessionEstablish {
  return msg.type === AC2MessageTypes.SESSION_ESTABLISH;
}

export function isSessionClose(msg: AC2BaseMessage): msg is AC2SessionClose {
  return msg.type === AC2MessageTypes.SESSION_CLOSE;
}

export function isStreamRequest(msg: AC2BaseMessage): msg is AC2StreamRequest {
  return msg.type === AC2MessageTypes.STREAM_REQUEST;
}

export function isStreamChunk(msg: AC2BaseMessage): msg is AC2StreamChunk {
  return msg.type === AC2MessageTypes.STREAM_CHUNK;
}

export function isStreamEnd(msg: AC2BaseMessage): msg is AC2StreamEnd {
  return msg.type === AC2MessageTypes.STREAM_END;
}

// ─── Handler Dispatch ─────────────────────────────────────────────────────────

/**
 * Optional handlers for each AC2 message type.
 * Provide only the types you care about; unhandled types are silently skipped
 * (or routed to `onUnknown` if provided).
 */
export interface MessageHandlers {
  onSigningRequest?: (msg: AC2SigningRequest) => void | Promise<void>;
  onSigningResponse?: (msg: AC2SigningResponse) => void | Promise<void>;
  onSigningRejected?: (msg: AC2SigningRejected) => void | Promise<void>;
  onKeyRequest?: (msg: AC2KeyRequest) => void | Promise<void>;
  onKeyResponse?: (msg: AC2KeyResponse) => void | Promise<void>;
  onSessionEstablish?: (msg: AC2SessionEstablish) => void | Promise<void>;
  onSessionClose?: (msg: AC2SessionClose) => void | Promise<void>;
  onStreamRequest?: (msg: AC2StreamRequest) => void | Promise<void>;
  onStreamChunk?: (msg: AC2StreamChunk) => void | Promise<void>;
  onStreamEnd?: (msg: AC2StreamEnd) => void | Promise<void>;
  /** Catch-all: called for unrecognised types or invalid messages */
  onUnknown?: (msg: AC2BaseMessage, validation: ValidationResult) => void | Promise<void>;
}

/**
 * Decode an AC2 message and dispatch it to the matching handler.
 *
 * Returns the validation result so callers can inspect errors without
 * needing a separate `validate()` call.
 *
 * @example
 * await handleMessage(dataChannelEvent.data, {
 *   onSigningRequest: async (msg) => {
 *     const approved = await presentToUser(msg.body);
 *     if (approved) sendSigningResponse(msg.id, sig);
 *     else          sendSigningRejected(msg.id, 'Rejected by user');
 *   },
 * });
 */
export async function handleMessage(
  raw: string | Record<string, unknown>,
  handlers: MessageHandlers,
): Promise<ValidationResult> {
  const { message, validation } = decode(raw);

  if (!validation.valid) {
    await handlers.onUnknown?.(message, validation);
    return validation;
  }

  const msg = message as AC2BaseMessage;

  if (isSigningRequest(msg)) await handlers.onSigningRequest?.(msg);
  else if (isSigningResponse(msg)) await handlers.onSigningResponse?.(msg);
  else if (isSigningRejected(msg)) await handlers.onSigningRejected?.(msg);
  else if (isKeyRequest(msg)) await handlers.onKeyRequest?.(msg);
  else if (isKeyResponse(msg)) await handlers.onKeyResponse?.(msg);
  else if (isSessionEstablish(msg)) await handlers.onSessionEstablish?.(msg);
  else if (isSessionClose(msg)) await handlers.onSessionClose?.(msg);
  else if (isStreamRequest(msg)) await handlers.onStreamRequest?.(msg);
  else if (isStreamChunk(msg)) await handlers.onStreamChunk?.(msg);
  else if (isStreamEnd(msg)) await handlers.onStreamEnd?.(msg);
  else await handlers.onUnknown?.(msg, validation);

  return validation;
}
