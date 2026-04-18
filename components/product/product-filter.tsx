"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api/categories";
import { brandsApi } from "@/lib/api/brands";
import type { Condition, Scale } from "@/types";
import { CONDITION_LABELS } from "@/types";

const SCALES: Scale[] = ["1:64", "1:43", "1:24", "1:18"];

export function ProductFilter({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: brandsApi.list,
  });

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("cursor"); // Reset pagination
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleReset = () => {
    router.push("/products");
    onClose?.();
  };

  const currentSort = searchParams.get("sortBy") || "";
  const currentCategory = searchParams.get("categoryId") || "";
  const currentBrand = searchParams.get("brandId") || "";
  const currentScale = searchParams.get("scale") || "";
  const currentCondition = searchParams.get("condition") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  return (
    <div className="space-y-5 p-4 md:p-0">
      {/* Sort */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
          Sắp xếp
        </Label>
        <Select
          value={currentSort || "newest"}
          onValueChange={(v) => updateParam("sortBy", v === "newest" ? undefined : v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="price_asc">Giá tăng dần</SelectItem>
            <SelectItem value="price_desc">Giá giảm dần</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
          Danh mục
        </Label>
        <Select
          value={currentCategory || "all"}
          onValueChange={(v) => updateParam("categoryId", v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
          Thương hiệu
        </Label>
        <Select
          value={currentBrand || "all"}
          onValueChange={(v) => updateParam("brandId", v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tất cả hãng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hãng</SelectItem>
            {brands?.map((brand) => (
              <SelectItem key={brand.id} value={String(brand.id)}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scale */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
          Tỉ lệ (Scale)
        </Label>
        <div className="flex flex-wrap gap-2">
          {SCALES.map((scale) => (
            <button
              key={scale}
              onClick={() =>
                updateParam("scale", currentScale === scale ? undefined : scale)
              }
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                currentScale === scale
                  ? "bg-carnest-blue text-white border-carnest-blue"
                  : "bg-white text-gray-600 border-gray-300 hover:border-carnest-blue"
              }`}
            >
              {scale}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
          Tình trạng
        </Label>
        <div className="space-y-1.5">
          {(Object.keys(CONDITION_LABELS) as Condition[]).map((cond) => (
            <button
              key={cond}
              onClick={() =>
                updateParam(
                  "condition",
                  currentCondition === cond ? undefined : cond
                )
              }
              className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                currentCondition === cond
                  ? "bg-carnest-blue text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {CONDITION_LABELS[cond]}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
          Khoảng giá (VNĐ)
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Từ"
            defaultValue={minPrice}
            className="h-8 text-sm"
            onBlur={(e) => updateParam("minPrice", e.target.value || undefined)}
          />
          <span className="text-gray-400">—</span>
          <Input
            type="number"
            placeholder="Đến"
            defaultValue={maxPrice}
            className="h-8 text-sm"
            onBlur={(e) => updateParam("maxPrice", e.target.value || undefined)}
          />
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleReset}
      >
        Xóa bộ lọc
      </Button>
    </div>
  );
}
