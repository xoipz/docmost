import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { IPage } from "@/features/page/types/page.types.ts";
import api from "@/lib/api-client.ts";

// API service functions
async function getJournalsBySpaceId(spaceId: string): Promise<IPage[]> {
  if (!spaceId) return [];
  
  console.log('Fetching journals for spaceId:', spaceId);
  
  const response = await api.post('/pages/journal/list', {
    spaceId,
    page: 1,
    limit: 100, // 获取足够多的日记
    includeContent: false,
  });
  
  console.log('Journal API response:', response);
  
  // 处理不同的响应格式
  const data = response.data;
  console.log('Journal API data:', data);
  
  if (Array.isArray(data)) {
    console.log('Returning direct array:', data);
    return data;
  }
  if (data && Array.isArray(data.items)) {
    console.log('Returning data.items:', data.items);
    return data.items;
  }
  if (data && Array.isArray(data.data)) {
    console.log('Returning data.data:', data.data);
    return data.data;
  }
  console.warn('Unexpected journal list response format:', data);
  return [];
}

async function getJournalByDate(spaceId: string, date: string): Promise<IPage | null> {
  if (!spaceId || !date) return null;
  
  try {
    const response = await api.post('/pages/journal/by-date', {
      spaceId,
      journalDate: date,
      includeContent: false,
    });
    return response.data;
  } catch (error) {
    // 如果没找到日记，返回null
    console.debug(`No journal found for date ${date}:`, error);
    return null;
  }
}

export function useGetJournalsQuery(
  spaceId?: string
): UseQueryResult<IPage[], Error> {
  return useQuery({
    queryKey: ["journals", spaceId],
    queryFn: () => {
      console.log('useGetJournalsQuery: 执行查询，spaceId:', spaceId);
      return getJournalsBySpaceId(spaceId!);
    },
    enabled: !!spaceId,
    staleTime: 30 * 1000, // 进一步减少到30秒，让数据更及时
    refetchOnMount: true, // 确保每次挂载时都会重新获取
    refetchOnWindowFocus: true, // 窗口重新获得焦点时重新获取
  });
}

export function useGetJournalByDateQuery(
  spaceId?: string,
  date?: string
): UseQueryResult<IPage | null, Error> {
  return useQuery({
    queryKey: ["journal", spaceId, date],
    queryFn: () => getJournalByDate(spaceId!, date!),
    enabled: !!spaceId && !!date,
    staleTime: 5 * 60 * 1000,
  });
}