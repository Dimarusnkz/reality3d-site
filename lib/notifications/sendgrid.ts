export async function sendEmailViaSendGrid(input: {
  to: string[]
  from: string
  subject: string
  text: string
}) {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) return { ok: false as const, error: 'SENDGRID_API_KEY not set' }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: input.to.map((email) => ({ email })) }],
      from: { email: input.from },
      subject: input.subject,
      content: [{ type: 'text/plain', value: input.text }],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { ok: false as const, error: body || `HTTP ${res.status}` }
  }

  return { ok: true as const }
}

