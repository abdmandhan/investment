import { prisma } from '@investment/urs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || 1;
  const limit = searchParams.get('limit') || 10;
  const skip = (Number(page) - 1) * Number(limit);

  const investors = await prisma.investors.findMany({
    take: Number(limit),
    skip: skip,
  });

  return new Response(JSON.stringify(investors));
}
