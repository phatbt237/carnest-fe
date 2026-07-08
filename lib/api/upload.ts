import apiClient from "./client";

function extractUrls(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string");
  if (typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.data)) {
    return (obj.data as unknown[]).filter((u): u is string => typeof u === "string");
  }
  if (typeof obj.data === "object" && obj.data !== null) {
    const inner = obj.data as Record<string, unknown>;
    if (Array.isArray(inner.urls)) {
      return (inner.urls as unknown[]).filter((u): u is string => typeof u === "string");
    }
    if (Array.isArray(inner.imageUrls)) {
      return (inner.imageUrls as unknown[]).filter((u): u is string => typeof u === "string");
    }
  }
  if (Array.isArray(obj.urls)) {
    return (obj.urls as unknown[]).filter((u): u is string => typeof u === "string");
  }
  return [];
}

export const uploadApi = {
  uploadImages: async (files: File[], folder: string): Promise<string[]> => {
    const fd = new FormData();
    files.forEach((file) => fd.append("files", file));
    const res = await apiClient.post(`/api/upload/images?folder=${folder}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const urls = extractUrls(res.data);
    if (urls.length === 0) throw new Error("Không lấy được URL ảnh từ server");
    return urls;
  },
};
