import { prisma } from '@investment/urs';

export async function GET(request: Request) {
  const investors = await prisma.investors.findMany({
    take: 10,
    include: {
      investor_accounts: true,
      investor_banks: true,
      investor_corporates: true,
      investor_addresses: true,
      investor_heirs: true,
      investor_individuals: true
    }
  });

  return new Response(JSON.stringify(investors));
}
