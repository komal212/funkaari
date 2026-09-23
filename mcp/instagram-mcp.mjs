#!/usr/bin/env node
/**
 * Funkaari Instagram MCP (stdio, Content-Length framing).
 */
function send(msg) {
  const json = JSON.stringify(msg);
  const buf = Buffer.from(json, "utf8");
  process.stdout.write(`Content-Length: ${buf.length}\r\n\r\n`);
  process.stdout.write(buf);
}

function profileUrl(handle) {
  const h = String(handle || "").replace(/^@/, "").trim();
  return `https://www.instagram.com/${h}/`;
}

function searchUrl(query) {
  return `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(String(query || ""))}`;
}

function postUrl(code) {
  return `https://www.instagram.com/p/${String(code || "").replace(/\s/g, "")}/`;
}

const TOOLS = [
  {
    name: "instagram_profile_url",
    description: "Working Instagram profile URL for a preschool handle.",
    inputSchema: {
      type: "object",
      properties: { handle: { type: "string" } },
      required: ["handle"],
    },
  },
  {
    name: "instagram_search_url",
    description: "Instagram keyword search URL.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "instagram_post_url",
    description: "Instagram post URL from a shortcode.",
    inputSchema: {
      type: "object",
      properties: { shortcode: { type: "string" } },
      required: ["shortcode"],
    },
  },
];

function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== "2.0") return;

  if (msg.method === "initialize") {
    send({
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "funkaari-instagram", version: "1.0.0" },
      },
    });
    return;
  }

  if (msg.method === "notifications/initialized") return;

  if (msg.method === "tools/list") {
    send({ jsonrpc: "2.0", id: msg.id, result: { tools: TOOLS } });
    return;
  }

  if (msg.method === "tools/call") {
    const name = msg.params?.name;
    const args = msg.params?.arguments ?? {};
    let url = "";
    if (name === "instagram_profile_url") url = profileUrl(args.handle);
    else if (name === "instagram_search_url") url = searchUrl(args.query);
    else if (name === "instagram_post_url") url = postUrl(args.shortcode);
    else {
      send({
        jsonrpc: "2.0",
        id: msg.id,
        error: { code: -32601, message: `Unknown tool: ${name}` },
      });
      return;
    }
    send({
      jsonrpc: "2.0",
      id: msg.id,
      result: { content: [{ type: "text", text: url }] },
    });
  }
}

let buffer = Buffer.alloc(0);
process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;
    const header = buffer.subarray(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buffer = buffer.subarray(headerEnd + 4);
      continue;
    }
    const length = Number(match[1]);
    const start = headerEnd + 4;
    if (buffer.length < start + length) break;
    const body = buffer.subarray(start, start + length).toString("utf8");
    buffer = buffer.subarray(start + length);
    try {
      handleMessage(JSON.parse(body));
    } catch (err) {
      process.stderr.write(`instagram-mcp: ${err}\n`);
    }
  }
});
process.stdin.on("end", () => process.exit(0));
