"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/context/auth-context";
import { getErrorMessage } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().min(2, "Họ tên ít nhất 2 ký tự"),
  username: z
    .string()
    .min(3, "Username ít nhất 3 ký tự")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Chỉ dùng chữ, số và _"),
  email: z.string().email("Email không hợp lệ"),
  phone: z
    .string()
    .regex(/^(0|\+84)[0-9]{8,9}$/, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authRegister({
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      document.cookie = "carnest_auth=1; path=/; max-age=2592000; SameSite=Lax";
      toast.success("Đăng ký thành công! Chào mừng bạn đến CarNest!");
      router.push("/");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Car className="h-8 w-8 text-carnest-orange" />
            <span className="text-2xl font-bold text-carnest-blue">
              Car<span className="text-carnest-orange">Nest</span>
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-4">
            Tạo tài khoản
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tham gia cộng đồng collector xe mô hình
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { id: "fullName", label: "Họ và tên", placeholder: "Nguyễn Văn A", type: "text" },
              { id: "username", label: "Tên đăng nhập", placeholder: "nguyenvana", type: "text" },
              { id: "email", label: "Email", placeholder: "email@example.com", type: "email" },
              { id: "phone", label: "Số điện thoại", placeholder: "0912345678", type: "tel" },
              { id: "password", label: "Mật khẩu", placeholder: "••••••••", type: "password" },
              { id: "confirmPassword", label: "Xác nhận mật khẩu", placeholder: "••••••••", type: "password" },
            ].map((field) => (
              <div key={field.id}>
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  type={field.type}
                  {...register(field.id as keyof FormData)}
                  className="mt-1"
                  placeholder={field.placeholder}
                />
                {errors[field.id as keyof FormData] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors[field.id as keyof FormData]?.message}
                  </p>
                )}
              </div>
            ))}

            <Button
              type="submit"
              className="w-full bg-carnest-blue hover:bg-carnest-blue-dark text-white h-10"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-carnest-blue font-medium hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
