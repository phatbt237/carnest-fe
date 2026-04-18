import Link from "next/link";
import { Car, Facebook, Instagram, Youtube } from "lucide-react";

const FOOTER_LINKS = [
  {
    heading: "Mua sắm",
    links: [
      { label: "Tất cả sản phẩm", href: "/products" },
      { label: "Cửa hàng", href: "/shops" },
      { label: "Đấu giá", href: "/auctions" },
      { label: "Scale 1:64", href: "/products?scale=1:64" },
      { label: "Scale 1:18", href: "/products?scale=1:18" },
    ],
  },
  {
    heading: "Tài khoản",
    links: [
      { label: "Đăng nhập", href: "/login" },
      { label: "Đăng ký", href: "/register" },
      { label: "Đơn hàng", href: "/orders" },
      { label: "Ví tiền", href: "/wallet" },
      { label: "Bán hàng", href: "/dashboard/shop" },
    ],
  },
  {
    heading: "Hỗ trợ",
    links: [
      { label: "Hướng dẫn mua hàng", href: "#" },
      { label: "Chính sách bảo vệ", href: "#" },
      { label: "Giải quyết tranh chấp", href: "#" },
      { label: "Liên hệ", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-carnest-navy text-white mt-auto">
      {/* Top divider accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-carnest-gold/40 to-transparent" />

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="h-8 w-8 rounded-lg bg-carnest-gold/10 border border-carnest-gold/30 flex items-center justify-center transition-all group-hover:bg-carnest-gold/20">
                <Car className="h-4 w-4 text-carnest-gold" />
              </div>
              <span className="text-[1.1rem] font-heading font-bold tracking-tight">
                Car<span className="text-carnest-gold">Nest</span>
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-5">
              Marketplace chuyên biệt dành cho người yêu xe mô hình diecast tại
              Việt Nam.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Facebook, href: "#" },
                { Icon: Instagram, href: "#" },
                { Icon: Youtube, href: "#" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-carnest-gold hover:border-carnest-gold/40 transition-all"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <h4 className="font-heading font-semibold text-sm text-carnest-gold mb-4 tracking-wide">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>© 2024 CarNest. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white/70 transition-colors">
              Điều khoản sử dụng
            </a>
            <a href="#" className="hover:text-white/70 transition-colors">
              Chính sách bảo mật
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
