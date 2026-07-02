import { queryOptions } from "@tanstack/react-query";
import { animeApi } from '@/lib/anilist';

export const qk = {
  trending: (page = 1) =>
    queryOptions({
      queryKey: ["anime", "trending", page] as const,
      queryFn: () => animeApi.trending(page),
      staleTime: 5 * 60_000,
    }),
  popular: (page = 1) =>
    queryOptions({
      queryKey: ["anime", "popular", page] as const,
      queryFn: () => animeApi.popular(page),
      staleTime: 10 * 60_000,
    }),
  recent: (page = 1) =>
    queryOptions({
      queryKey: ["anime", "recent", page] as const,
      queryFn: () => animeApi.recentEpisodes(page),
      staleTime: 2 * 60_000,
    }),
  airing: (page = 1) =>
    queryOptions({
      queryKey: ["anime", "airing", page] as const,
      queryFn: () => animeApi.airingSchedule(page),
      staleTime: 10 * 60_000,
    }),
  search: (q: string, page = 1) =>
    queryOptions({
      queryKey: ["anime", "search", q, page] as const,
      queryFn: () => animeApi.search(q, page),
      enabled: q.trim().length > 0,
      staleTime: 60_000,
    }),
  advanced: (params: Parameters<typeof animeApi.advancedSearch>[0]) =>
    queryOptions({
      queryKey: ["anime", "advanced", params] as const,
      queryFn: () => animeApi.advancedSearch(params),
      staleTime: 60_000,
    }),
  info: (id: string) =>
    queryOptions({
      queryKey: ["anime", "info", id] as const,
      queryFn: () => animeApi.info(id),
      staleTime: 60 * 60_000,
    }),
  watch: (episodeId: string) =>
    queryOptions({
      queryKey: ["anime", "watch", episodeId] as const,
      queryFn: () => animeApi.watch(episodeId),
      staleTime: 10 * 60_000,
      retry: 1,
    }),
};
