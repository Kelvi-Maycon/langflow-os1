// services/gemini.js — Chamadas Gemini API

export async function callGemini({
  apiKey,
  model = 'gemini-2.0-flash',
  systemPrompt,
  userPrompt,
  signal,
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.7,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini error: ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

export async function testGemini(apiKey, model) {
  return callGemini({
    apiKey,
    model,
    systemPrompt: 'You are a helpful assistant.',
    userPrompt: 'Reply with exactly: OK',
  })
}
