Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }
  const body = await req.json();
  const text = body.input || body.text || "";
  const r = await fetch("https://api.elevenlabs.io/v1/text-to-speech/PKGMvqhCP6JmC71STJvc", {
    method: "POST",
    headers: { "xi-api-key": Deno.env.get("ELEVENLABS_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.6, similarity_boost: 0.8 } })
  });
  return new Response(r.body, { headers: { "Content-Type": "audio/mpeg", "Access-Control-Allow-Origin": "*" } });
});
