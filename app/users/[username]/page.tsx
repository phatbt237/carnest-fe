"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Star, Package, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeDisplay } from "@/components/badge/badge-display";
import { badgesApi } from "@/lib/api/badges";
import { showcasesApi } from "@/lib/api/showcases";
import { useAuth } from "@/lib/context/auth-context";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();

  // We don't have a getUserByUsername API, so we'll use badges + showcases to build profile
  // Try to get badges for current user if username matches, else use public endpoints
  const isOwnProfile = currentUser?.username === username;

  const badgesQuery = useQuery({
    queryKey: ["user-badges", username],
    queryFn: () =>
      isOwnProfile
        ? badgesApi.getMy()
        : badgesApi.getByUser(0), // Would need user ID lookup
    enabled: !!username,
  });

  const showcasesQuery = useQuery({
    queryKey: ["user-showcases", username],
    queryFn: () => showcasesApi.getByUser(currentUser?.id ?? 0),
    enabled: isOwnProfile && !!currentUser,
  });

  const badges = badgesQuery.data ?? [];
  const showcases = showcasesQuery.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile header */}
      <div className="rounded-xl border bg-white p-6 mb-6 flex items-center gap-5">
        <div className="h-20 w-20 rounded-full bg-carnest-blue/10 flex items-center justify-center text-2xl font-bold text-carnest-blue overflow-hidden shrink-0">
          {currentUser?.avatarUrl ? (
            <Image
              src={currentUser.avatarUrl}
              alt={username}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            username.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">@{username}</h1>
          {isOwnProfile && currentUser && (
            <p className="text-sm text-gray-500 mt-0.5">{currentUser.fullName}</p>
          )}
          {isOwnProfile && currentUser && (
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>
                <strong className="text-gray-900">{currentUser.totalBought}</strong> đã mua
              </span>
              <span>
                <strong className="text-gray-900">{currentUser.totalSold}</strong> đã bán
              </span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="badges">
        <TabsList className="mb-6">
          <TabsTrigger value="badges">
            <Award className="mr-1.5 h-4 w-4" />
            Huy hiệu ({badges.length})
          </TabsTrigger>
          <TabsTrigger value="showcases">
            <Star className="mr-1.5 h-4 w-4" />
            Bộ sưu tập ({showcases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="badges">
          {badgesQuery.isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <BadgeDisplay badges={badges} />
          )}
        </TabsContent>

        <TabsContent value="showcases">
          {showcasesQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : showcases.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có bộ sưu tập nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {showcases.map((sc) => (
                <Link
                  key={sc.id}
                  href={`/showcases/${sc.id}`}
                  className="group rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-36 bg-gradient-to-br from-carnest-blue/20 to-carnest-gold/20 overflow-hidden">
                    {sc.coverImageUrl && (
                      <Image
                        src={sc.coverImageUrl}
                        alt={sc.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{sc.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {sc.description}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-400 mt-3">
                      <span>{sc.itemCount} xe</span>
                      <span>♥ {sc.likeCount}</span>
                      <span>{sc.viewCount} lượt xem</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
