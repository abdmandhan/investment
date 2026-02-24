import { prisma } from '@investment/urs';

export async function GET(request: Request) {
  const investors = await prisma.investors.findMany({ where: { first_name: { contains: 'Abdur' } } });
  return new Response(JSON.stringify(investors));
}
