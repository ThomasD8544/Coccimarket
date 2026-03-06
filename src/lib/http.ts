export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
}

export function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}
