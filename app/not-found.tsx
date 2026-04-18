import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Car className="h-20 w-20 text-gray-200 mb-6" />
      <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-3">
        Trang không tồn tại
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Trang bạn tìm kiếm đã bị xóa hoặc không tồn tại. Hãy quay lại trang
        chủ để khám phá xe mô hình.
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button className="bg-carnest-blue hover:bg-carnest-blue-dark text-white">
            Về trang chủ
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="outline">Xem sản phẩm</Button>
        </Link>
      </div>
    </div>
  );
}
