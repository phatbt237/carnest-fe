"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Car, Eye, EyeOff, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/context/auth-context";
import { getErrorMessage } from "@/lib/utils";

const schema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data);
      toast.success("Đăng nhập thành công!");
      router.push(redirect);
    } catch (err) {
      setError("username", { type: "manual", message: getErrorMessage(err) });
      resetField("username", { keepError: true, defaultValue: "" });
      resetField("password", { defaultValue: "" });
      setFocus("username");
    }
  };

  return (
    <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-carnest-navy to-slate-800 px-4 py-12 min-h-[calc(100vh-4rem)]">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-carnest-orange/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-carnest-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
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
          <h1 className="text-2xl font-bold text-white mt-6">Chào mừng trở lại!</h1>
          <p className="text-sm text-white/50 mt-1.5">Đăng nhập để tiếp tục khám phá</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="username" className="text-white/80 text-sm font-medium">
                Tên đăng nhập
              </Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="Tên đăng nhập"
                  autoComplete="username"
                  className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-white/25 focus:border-carnest-orange focus:ring-carnest-orange/20 h-11"
                />
              </div>
              <p className="text-xs text-red-400 mt-1.5 min-h-[1rem]">
                {errors.username?.message}
              </p>
            </div>

            <div>
              <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                Mật khẩu
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pl-10 pr-10 bg-white/10 border-white/10 text-white placeholder:text-white/25 focus:border-carnest-orange focus:ring-carnest-orange/20 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-red-400 mt-1.5 min-h-[1rem]">
                {errors.password?.message}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-carnest-orange hover:bg-carnest-orange/90 text-white font-semibold rounded-xl shadow-lg shadow-carnest-orange/25 transition-all hover:shadow-carnest-orange/40 hover:scale-[1.01]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-white/50">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-carnest-orange font-semibold hover:text-carnest-orange/80 transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
