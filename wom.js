const WOM_BASE = "https://api.wiseoldman.net/v2";

// Simple in-memory cache — survives between warm function invocations
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

exports.handler = async function(event) {
  const path = event.queryStringParameters && event.queryStringParameters.path;

  if (!path) {
    return {
      statusCode: 400,
      headers: cors(),
      body: JSON.stringify({ error: "Missing path parameter" })
    };
  }

  // Only allow our group's endpoints
  if (!path.startsWith("/groups/22998") && !path.startsWith("/players/") && !path.startsWith("/competitions/")) {
    return {
      statusCode: 403,
      headers: cors(),
      body: JSON.stringify({ error: "Forbidden" })
    };
  }

  // Check cache
  const now = Date.now();
  if (cache[path] && (now - cache[path].ts) < CACHE_TTL) {
    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify(cache[path].data)
    };
  }

  // Fetch from WOM
  try {
    const res = await fetch(WOM_BASE + path, {
      headers: {
        "User-Agent": "SanguineOath Clan Website",
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: cors(),
        body: JSON.stringify({ error: `WOM returned ${res.status}` })
      };
    }

    const data = await res.json();

    // Cache it
    cache[path] = { data, ts: Date.now() };

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: err.message })
    };
  }
};

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
}
