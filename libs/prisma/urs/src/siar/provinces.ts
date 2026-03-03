import siar from '@investment/siar';
import { prisma } from '../index.js';

export const importProvincesFromSiar = async () => {
  const count = await siar.tRefKotaNew.count();
  const ursCount = await prisma.provinces.count();

  if (count <= ursCount) {
    console.log('provinces already imported');
    return;
  }

  const levels = ['Propinsi', 'Kabupaten', 'Kecamatan', 'Kelurahan'] as const;

  for (const kodeWilayah of levels) {
    const rows = await siar.tRefKotaNew.findMany({
      where: { KodeWilayah: kodeWilayah },
    });

    const batchSize = 1000;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      await Promise.all(
        batch.map((row) => {
          const id = row.KodeKota;
          const parentId = row.ParentCode || null;
          const name = row.Prop.trim();
          const type = resolveProvinceType(kodeWilayah);

          return prisma.provinces.upsert({
            where: { id },
            create: {
              id,
              parent_id: parentId,
              no: row.No ? Number(row.No) : null,
              name,
              postal_code: row.PostalCode || null,
              type,
            },
            update: {
              parent_id: parentId,
              no: row.No ? Number(row.No) : null,
              name,
              postal_code: row.PostalCode || null,
              type,
            },
          });
        }),
      );
    }
  }
};

export const getProvinceHierarchy = async (provinceId: string) => {
  const result: { id: string; name: string; type: string; postal_code: string | null }[] = [];

  let currentId: string | null = provinceId;

  while (currentId) {
    const node: any = await prisma.provinces.findUnique({
      where: { id: currentId },
    });

    if (!node) {
      break;
    }

    result.unshift({ id: node.id, name: node.name, type: node.type, postal_code: node.postal_code });
    currentId = node.parent_id;
  }

  return result;
};

export const getFullAddressTextsFromProvinceId = async (provinceId: string) => {
  const hierarchy = await getProvinceHierarchy(provinceId);

  const province = hierarchy.find((item) => item.type === 'province');
  const city = hierarchy.find((item) => item.type === 'city');
  const district = hierarchy.find((item) => item.type === 'district');
  const subdistrict = hierarchy.find((item) => item.type === 'subdistrict');

  return {
    province_text: province?.name ?? null,
    city_text: city?.name ?? null,
    district_text: district?.name ?? null,
    subdistrict_text: subdistrict?.name ?? null,
    postal_code: subdistrict?.postal_code?.trim() ?? null,
  };
};

const resolveProvinceType = (kodeWilayah: string): string => {
  switch (kodeWilayah) {
    case 'Propinsi':
      return 'province';
    case 'Kabupaten':
      return 'city';
    case 'Kecamatan':
      return 'district';
    case 'Kelurahan':
      return 'subdistrict';
    default:
      return 'province';
  }
};

