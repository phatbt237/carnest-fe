export interface VnProvince {
  code: string;
  name: string;
}

export interface VnDistrict {
  code: string;
  provinceCode: string;
  name: string;
}

export interface VnWard {
  code: string;
  districtCode: string;
  name: string;
}

export async function getProvinces(): Promise<VnProvince[]> {
  const { default: data } = await import("./vn-address/provinces.json");
  return data;
}

export async function getDistricts(provinceCode: string): Promise<VnDistrict[]> {
  const { default: data } = await import("./vn-address/districts.json");
  return (data as VnDistrict[]).filter((d) => d.provinceCode === provinceCode);
}

export async function getWards(districtCode: string): Promise<VnWard[]> {
  const { default: data } = await import("./vn-address/wards.json");
  return (data as VnWard[]).filter((w) => w.districtCode === districtCode);
}
