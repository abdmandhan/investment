import { prisma } from '@investment/urs';

export async function GET(request: Request) {
  const users = await prisma.users.findMany();
  return new Response(JSON.stringify(users));
}
