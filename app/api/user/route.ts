export async function GET() {
  return new Response(JSON.stringify({ message: 'User API works' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
