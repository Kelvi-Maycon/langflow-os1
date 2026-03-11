// services/openai.js — Chamadas OpenAI API

function getMessageText(data) {
  return data.choices?.[0]?.message?.content?.trim() || ''
}

function withTokenLimit(model, maxTokens) {
  if (String(model || '').startsWith('gpt-5')) {
    return { max_completion_tokens: maxTokens }
  }
  return { max_tokens: maxTokens }
}

function withTemperature(model, temperature) {
  if (String(model || '').startsWith('gpt-5')) {
    return {}
  }
  return { temperature }
}

function withReasoning(model) {
  if (String(model || '').startsWith('gpt-5')) {
    return { reasoning_effort: 'minimal' }
  }
  return {}
}

async function openAIRequest(apiKey, body, signal) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI error: ${res.status}`)
  }

  return res.json()
}

export async function callOpenAI({
  apiKey,
  model = 'gpt-5-mini',
  systemPrompt,
  userPrompt,
  maxTokens = 400,
  temperature = 0.7,
  signal,
}) {
  const data = await openAIRequest(
    apiKey,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      ...withTokenLimit(model, maxTokens),
      ...withTemperature(model, temperature),
      ...withReasoning(model),
    },
    signal,
  )

  return getMessageText(data)
}

export async function callOpenAIStructured({
  apiKey,
  model = 'gpt-5-mini',
  systemPrompt,
  userPrompt,
  schemaName,
  schema,
  maxTokens = 800,
  signal,
}) {
  const data = await openAIRequest(
    apiKey,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName,
          strict: true,
          schema,
        },
      },
      ...withTokenLimit(model, maxTokens),
      ...withTemperature(model, 0),
      ...withReasoning(model),
    },
    signal,
  )

  const message = data.choices?.[0]?.message
  if (message?.refusal) {
    throw new Error(message.refusal)
  }

  const text = getMessageText(data)
  if (!text) {
    throw new Error('OpenAI returned an empty structured response.')
  }

  return JSON.parse(text)
}

export async function testOpenAI(apiKey, model) {
  return callOpenAI({
    apiKey,
    model,
    systemPrompt: 'You are a helpful assistant.',
    userPrompt: 'Reply with exactly: OK',
  })
}
