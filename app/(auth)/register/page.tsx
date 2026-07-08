"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car, Lock, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/context/auth-context";
import { getErrorMessage } from "@/lib/utils";

const schema = z
  .object({
    fullName: z.string().min(2, "Họ tên ít nhất 2 ký tự"),
    username: z
      .string()
      .min(3, "Username ít nhất 3 ký tự")
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Chỉ dùng chữ, số và _"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().regex(/^(0|\+84)[0-9]{8,9}$/, "Số điện thoại không hợp lệ"),
    password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const fields = [
  { id: "fullName", label: "Họ và tên", placeholder: "Nguyễn Văn A", type: "text", icon: User },
  { id: "username", label: "Tên đăng nhập", placeholder: "nguyenvana", type: "text", icon: User },
  { id: "email", label: "Email", placeholder: "email@example.com", type: "email", icon: Mail },
  { id: "phone", label: "Số điện thoại", placeholder: "0912345678", type: "tel", icon: Phone },
  { id: "password", label: "Mật khẩu", placeholder: "••••••••", type: "password", icon: Lock },
  { id: "confirmPassword", label: "Xác nhận mật khẩu", placeholder: "••••••••", type: "password", icon: Lock },
] as const;

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
    <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-carnest-navy to-slate-800 px-4 py-12 min-h-[calc(100vh-4rem)]">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-carnest-orange/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-carnest-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[480px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="p-2.5 bg-carnest-orange rounded-2xl shadow-lg shadow-carnest-orange/30 group-hover:scale-105 transition-transform">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Car<span className="text-carnest-orange">Nest</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6">Tạo tài khoản</h1>
          <p className="text-sm text-white/50 mt-1.5">Tham gia cộng đồng collector xe mô hình</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {fields.map(({ id, label, placeholder, type, icon: Icon }) => (
              <div key={id}>
                <Label htmlFor={id} className="text-white/80 text-sm font-medium">
                  {label}
                </Label>
                <div className="relative mt-1.5">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    id={id}
                    type={type}
                    {...register(id as keyof FormData)}
                    placeholder={placeholder}
                    className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-white/25 focus:border-carnest-orange focus:ring-carnest-orange/20 h-11"
                  />
                </div>
                {errors[id as keyof FormData] && (
                  <p className="text-xs text-red-400 mt-1.5">
                    {errors[id as keyof FormData]?.message}
                  </p>
                )}
              </div>
            ))}

            <Button
              type="submit"
              className="w-full h-11 mt-2 bg-carnest-orange hover:bg-carnest-orange/90 text-white font-semibold rounded-xl shadow-lg shadow-carnest-orange/25 transition-all hover:shadow-carnest-orange/40 hover:scale-[1.01]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang đăng ký..." : "Tạo tài khoản"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-white/50">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-carnest-orange font-semibold hover:text-carnest-orange/80 transition-colors"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
