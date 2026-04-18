"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency, formatDateTime, getErrorMessage } from "@/lib/utils";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  PlusCircle,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import type { TransactionType, WalletTransaction } from "@/types";

const TX_LABELS: Record<TransactionType, string> = {
  DEPOSIT: "Nạp tiền",
  WITHDRAW: "Rút tiền",
  PAYMENT: "Thanh toán",
  REFUND: "Hoàn tiền",
  EARNING: "Thu nhập",
  ESCROW_HOLD: "Tạm giữ tiền",
};

type TxStyle = "positive" | "negative" | "escrow";

function getTxStyle(tx: WalletTransaction): TxStyle {
  if (tx.type === "ESCROW_HOLD") return "escrow";
  return tx.amount >= 0 ? "positive" : "negative";
}

function TxIcon({ style }: { style: TxStyle }) {
  if (style === "escrow")
    return (
      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <Clock className="h-4 w-4 text-amber-600" />
      </div>
    );
  if (style === "positive")
    return (
      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <ArrowDownCircle className="h-4 w-4 text-green-600" />
      </div>
    );
  return (
    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
      <ArrowUpCircle className="h-4 w-4 text-red-600" />
    </div>
  );
}

function amountClass(style: TxStyle) {
  if (style === "escrow") return "text-amber-600";
  if (style === "positive") return "text-green-600";
  return "text-red-600";
}

function amountPrefix(style: TxStyle, amount: number) {
  if (style === "escrow") return "";
  return amount >= 0 ? "+" : "";
}

// ─── Product preview dialog ────────────────────────────────────────────────
function ProductPreviewDialog({
  product,
  open,
  onClose,
}: {
  product: NonNullable<WalletTransaction["relatedProduct"]>;
  open: boolean;
  onClose: () => void;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const images = product.imageUrls?.length ? product.imageUrls : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
            {images.length > 0 ? (
              <Image
                src={images[activeImg]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="360px"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300">
                <ImageIcon className="h-12 w-12" />
              </div>
            )}
          </div>
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative h-14 w-14 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    activeImg === i ? "border-carnest-blue" : "border-transparent"
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
          {/* Link to product */}
          <Link
            href={`/products/${product.slug}`}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-carnest-blue text-carnest-blue text-sm font-medium hover:bg-carnest-blue hover:text-white transition-colors"
            onClick={onClose}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Xem chi tiết sản phẩm
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Single transaction row ────────────────────────────────────────────────
function TxRow({ tx }: { tx: WalletTransaction }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const style = getTxStyle(tx);

  return (
    <>
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-3 min-w-0">
          <TxIcon style={style} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{TX_LABELS[tx.type]}</p>
            {tx.description && (
              <p className="text-xs text-gray-600 truncate max-w-[200px]">{tx.description}</p>
            )}
            <p className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</p>
          </div>
          {/* Product thumbnail — only if relatedProduct present */}
          {tx.relatedProduct && tx.relatedProduct.imageUrls?.length > 0 && (
            <button
              onClick={() => setPreviewOpen(true)}
              className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 hover:opacity-80 transition-opacity"
              title="Xem sản phẩm"
            >
              <Image
                src={tx.relatedProduct.imageUrls[0]}
                alt={tx.relatedProduct.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </button>
          )}
        </div>

        <div className="text-right shrink-0 pl-3">
          <p className={`font-semibold text-sm ${amountClass(style)}`}>
            {amountPrefix(style, tx.amount)}
            {formatCurrency(tx.amount)}
          </p>
          <p className="text-xs text-gray-400">Số dư: {formatCurrency(tx.balanceAfter)}</p>
        </div>
      </div>

      {tx.relatedProduct && (
        <ProductPreviewDialog
          product={tx.relatedProduct}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const queryClient = useQueryClient();
  const [depositAmount, setDepositAmount] = useState("");

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: ordersApi.getWallet,
  });

  const {
    data: txData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: txLoading,
  } = useInfiniteQuery({
    queryKey: ["wallet-transactions"],
    queryFn: ({ pageParam }) =>
      ordersApi.walletTransactions({ cursor: pageParam as string | undefined, size: 10 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
  });

  const transactions = txData?.pages.flatMap((p) => p.items) ?? [];

  const depositMutation = useMutation({
    mutationFn: () => ordersApi.deposit(Number(depositAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast.success(`Nạp ${formatCurrency(Number(depositAmount))} thành công!`);
      setDepositAmount("");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Wallet className="h-6 w-6 text-carnest-blue" />
        Ví tiền
      </h1>

      {/* Balance */}
      <div className="rounded-2xl bg-gradient-to-br from-carnest-blue to-carnest-blue-light p-6 text-white mb-6">
        <p className="text-sm text-white/70 mb-1">Số dư hiện tại</p>
        {walletLoading ? (
          <Skeleton className="h-10 w-1/2 bg-white/20" />
        ) : (
          <p className="text-4xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          Tiền vào
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          Tiền ra
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          Đang giữ (tạm giữ)
        </span>
      </div>

      {/* Deposit (demo) */}
      <div className="rounded-xl border bg-white p-5 mb-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Nạp tiền (Demo)</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => setDepositAmount(String(amount))}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                depositAmount === String(amount)
                  ? "bg-carnest-blue text-white border-carnest-blue"
                  : "border-gray-300 text-gray-700 hover:border-carnest-blue"
              }`}
            >
              {formatCurrency(amount)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Nhập số tiền"
            className="flex-1"
          />
          <Button
            onClick={() => depositMutation.mutate()}
            disabled={!depositAmount || depositMutation.isPending}
            className="bg-carnest-blue text-white"
          >
            <PlusCircle className="mr-1.5 h-4 w-4" />
            {depositMutation.isPending ? "Đang nạp..." : "Nạp tiền"}
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Lịch sử giao dịch</h2>
        <Separator />
        {txLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-6">Chưa có giao dịch nào</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
        {hasNextPage && (
          <div className="text-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
