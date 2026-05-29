/**
 * AC2 Schema Validator — Demo
 *
 * Demonstrates decoding and handling all major AC2 message types:
 *   - ac2/SigningRequest  (agent → controller)
 *   - ac2/SigningResponse (controller → agent)
 *   - ac2/SigningRejected (controller → agent)
 *   - ac2/KeyRequest      (agent → controller)
 *   - ac2/SessionEstablish
 *   - ac2/StreamChunk     (agent → controller, streaming)
 *
 * Run with:
 *   npx tsx examples/demo.ts
 */

import {
  AC2MessageTypes,
  decode,
  handleMessage,
  isSigningRejected,
  isSigningRequest,
  isSigningResponse,
  validate,
} from "../src/index.js";

// ─── Sample messages ──────────────────────────────────────────────────────────

const NOW = Math.floor(Date.now() / 1000);

/** Agent → Controller: request the user to sign an x402 payment payload */
const signingRequest = {
  "@context": ["https://ac2.io/v1"],
  id: "msg-sr-001",
  type: "ac2/SigningRequest",
  from: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  to: ["did:key:z6Mkk7yqnGF3bufarACithqtDdurcziiqoAZFnMD8v2Hz4Dr"],
  created_time: NOW,
  expires_time: NOW + 300,
  body: {
    description: "Pay 0.5 ALGO to api.example.com for AI inference access",
    encoding: "base64",
    payload: "dHJhbnNhY3Rpb24tZGF0YS1oZXJl",
    operation: "x402-payment",
    schema: "https://x402.org/schemas/payment/v1",
    context: "The agent needs to call a paid inference API endpoint",
  },
};

/** Controller → Agent: user approved and provides the signature */
const signingResponse = {
  "@context": ["https://ac2.io/v1"],
  id: "msg-sr-002",
  type: "ac2/SigningResponse",
  from: "did:key:z6Mkk7yqnGF3bufarACithqtDdurcziiqoAZFnMD8v2Hz4Dr",
  to: ["did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"],
  created_time: NOW + 5,
  thid: "msg-sr-001",
  body: {
    signature: "c2lnbmF0dXJlLWRhdGEtYmFzZTY0LWVuY29kZWQ=",
    timestamp: new Date().toISOString(),
  },
};

/** Controller → Agent: user rejected the signing request */
const signingRejected = {
  "@context": ["https://ac2.io/v1"],
  id: "msg-sr-003",
  type: "ac2/SigningRejected",
  from: "did:key:z6Mkk7yqnGF3bufarACithqtDdurcziiqoAZFnMD8v2Hz4Dr",
  to: ["did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"],
  created_time: NOW + 5,
  thid: "msg-sr-001",
  body: {
    reason: "Payment amount exceeds the configured daily limit of 0.1 ALGO",
  },
};

/** Agent → Controller: request the user's Ed25519 public key */
const keyRequest = {
  "@context": ["https://ac2.io/v1"],
  id: "msg-kr-001",
  type: "ac2/KeyRequest",
  from: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  to: ["did:key:z6Mkk7yqnGF3bufarACithqtDdurcziiqoAZFnMD8v2Hz4Dr"],
  created_time: NOW,
  body: {
    key_type: "ed25519",
    purpose: "Verify Algorand account ownership for x402 payment routing",
    for_operation: "algorand-txn",
  },
};

/** Session handshake on DataChannel "ac2-v1" open */
const sessionEstablish = {
  "@context": ["https://ac2.io/v1"],
  id: "msg-se-001",
  type: "ac2/SessionEstablish",
  from: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  to: ["did:key:z6Mkk7yqnGF3bufarACithqtDdurcziiqoAZFnMD8v2Hz4Dr"],
  created_time: NOW,
  body: {
    protocol_version: "1.0",
    agent_did: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    capabilities: ["signing", "streaming", "key-exchange"],
  },
};

/** Agent → Controller: a streaming text chunk */
const streamChunk = {
  "@context": ["https://ac2.io/v1"],
  id: "msg-sc-001",
  type: "ac2/StreamChunk",
  from: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  to: ["did:key:z6Mkk7yqnGF3bufarACithqtDdurcziiqoAZFnMD8v2Hz4Dr"],
  created_time: NOW,
  thid: "stream-req-001",
  body: {
    stream_id: "stream-abc123",
    sequence: 1,
    content: "Hello! I found a paid API endpoint and need your approval to proceed.",
    content_type: "text",
    is_last: false,
    usage: { input_tokens: 12, output_tokens: 18 },
  },
};

/** Intentionally invalid message for error-path demo */
const invalidMessage = {
  // @context missing (→ warning), id missing (→ error), from is not a DID (→ error)
  type: "ac2/SigningRequest",
  from: "not-a-did",
  to: ["did:key:bob"],
  created_time: NOW,
  body: {
    // missing required: description, encoding, payload, operation
    context: "some background info",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hr(title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1 ─ Direct validation ─────────────────────────────────────────────────────
  hr("1. Direct validation");

  const samples: [string, unknown][] = [
    ["SigningRequest", signingRequest],
    ["SigningResponse", signingResponse],
    ["SigningRejected", signingRejected],
    ["KeyRequest", keyRequest],
    ["SessionEstablish", sessionEstablish],
    ["StreamChunk", streamChunk],
    ["Invalid message", invalidMessage],
  ];

  for (const [label, msg] of samples) {
    const r = validate(msg);
    const icon = r.valid ? "✅" : "❌";
    console.log(`\n${icon} ${label}  [${r.messageType ?? "?"}]`);
    if (r.errors.length) r.errors.forEach((e) => console.log(`   error:   ${e}`));
    if (r.warnings.length) r.warnings.forEach((w) => console.log(`   warning: ${w}`));
  }

  // 2 ─ Decode from JSON string + type guard ──────────────────────────────────
  hr("2. Decode from JSON string + type guard");

  const rawJson = JSON.stringify({
    "@context": ["https://ac2.io/v1"],
    id: "msg-raw-001",
    type: AC2MessageTypes.SIGNING_REQUEST,
    from: "did:web:agent.example.com",
    to: ["did:key:z6Mkk7yqnGF3bufarACithqtDdurcziiqoAZFnMD8v2Hz4Dr"],
    created_time: NOW,
    body: {
      description: "Sign git commit for algorandfoundation/liquid-auth@main",
      encoding: "hex",
      payload: "deadbeefcafe",
      operation: "git-commit",
      context: "Automated PR merge — committer bot",
    },
  });

  const { message, validation } = decode(rawJson);
  console.log(`\nDecoded:  ${message.type}`);
  console.log(`Valid:    ${validation.valid}`);

  if (isSigningRequest(message)) {
    // TypeScript now knows message.body is SigningRequestBody ✓
    console.log(`Operation: ${message.body.operation}`);
    console.log(`Encoding:  ${message.body.encoding}`);
    console.log(`Payload:   ${message.body.payload}`);
  }

  // 3 ─ Handler-based dispatch ─────────────────────────────────────────────────
  hr("3. Handler-based dispatch (simulated DataChannel)");

  const incomingMessages = [
    signingRequest,
    signingResponse,
    signingRejected,
    keyRequest,
    sessionEstablish,
    streamChunk,
  ];

  for (const msg of incomingMessages) {
    await handleMessage(msg, {
      onSigningRequest: (m) => {
        console.log(`\n[SigningRequest]   id=${m.id}`);
        console.log(`  From:      ${m.from}`);
        console.log(`  Operation: ${m.body.operation}`);
        console.log(`  Desc:      ${m.body.description}`);
        console.log(`  → User would see a modal asking to approve/reject`);
      },

      onSigningResponse: (m) => {
        console.log(`\n[SigningResponse]  id=${m.id}  thread=${m.thid}`);
        console.log(`  Sig: ${m.body.signature.slice(0, 24)}…`);
        console.log(`  → Agent can now submit the signed transaction`);
      },

      onSigningRejected: (m) => {
        console.log(`\n[SigningRejected]  id=${m.id}  thread=${m.thid}`);
        console.log(`  Reason: ${m.body.reason}`);
        console.log(`  → Agent must abort the operation`);
      },

      onKeyRequest: (m) => {
        console.log(`\n[KeyRequest]       id=${m.id}`);
        console.log(`  KeyType: ${m.body.key_type}`);
        console.log(`  Purpose: ${m.body.purpose}`);
      },

      onSessionEstablish: (m) => {
        console.log(`\n[SessionEstablish] id=${m.id}`);
        console.log(`  Protocol:     ${m.body.protocol_version}`);
        console.log(`  Capabilities: ${m.body.capabilities?.join(", ")}`);
      },

      onStreamChunk: (m) => {
        console.log(`\n[StreamChunk]      id=${m.id}  seq=${m.body.sequence}`);
        console.log(`  Stream: ${m.body.stream_id}`);
        console.log(`  Text:   "${m.body.content.slice(0, 50)}…"`);
        console.log(
          `  Tokens: in=${m.body.usage?.input_tokens} out=${m.body.usage?.output_tokens}`,
        );
      },
    });
  }

  // 4 ─ Invalid message error path ─────────────────────────────────────────────
  hr("4. Invalid message — error path");

  await handleMessage(invalidMessage, {
    onUnknown: (msg, v) => {
      console.log(`\n[Invalid]  type="${msg.type}"`);
      console.log(`  Errors:`);
      v.errors.forEach((e) => console.log(`    • ${e}`));
      if (v.warnings.length) {
        console.log(`  Warnings:`);
        v.warnings.forEach((w) => console.log(`    ⚠ ${w}`));
      }
    },
  });

  // 5 ─ x402 signing flow simulation ───────────────────────────────────────────
  hr("5. Full x402 signing flow simulation");

  console.log("\nAgent detects x402-payment endpoint…");
  console.log('Agent sends SigningRequest to controller via DataChannel "ac2-v1"\n');

  // Simulate the controller responding after review
  const simulatedApproval = signingResponse;
  const simulatedRejection = signingRejected;

  for (const response of [simulatedApproval, simulatedRejection]) {
    const { message: resp } = decode(response);

    if (isSigningResponse(resp)) {
      console.log(`✅ Controller approved  — signature: ${resp.body.signature.slice(0, 16)}…`);
      console.log("   Agent proceeds with x402 payment using delegated signature.");
    } else if (isSigningRejected(resp)) {
      console.log(`❌ Controller rejected  — ${resp.body.reason}`);
      console.log("   Agent aborts operation and reports back to the user.");
    }
  }

  console.log("\n✅  Demo complete.\n");
}

main().catch(console.error);
