import { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useCreatePageMutation } from '@/features/page/queries/page-query';
import { useGetSpaceBySlugQuery } from '@/features/space/queries/space-query';
import { useGetJournalsQuery } from '@/features/journal/queries/journal-query';
import useCurrentUser from '@/features/user/hooks/use-current-user';
import { showNotification } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client.ts';

export default function NewPage() {
  const { t } = useTranslation();
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug!);
  const { data: journals = [], isLoading: journalsLoading } = useGetJournalsQuery(space?.id);
  const createPageMutation = useCreatePageMutation();
  const hasCreated = useRef(false);

  useEffect(() => {
    if (!spaceSlug || !currentUser || !space || hasCreated.current) return;

    const journalDate = searchParams.get('journal');
    
    // 如果是日记，先检查是否已存在
    if (journalDate) {
      // 等待 journals 数据加载完成
      if (journalsLoading) {
        console.log('Journals still loading, waiting...');
        return;
      }
      
      const existingJournal = journals.find(
        (journal) => journal.isJournal && journal.journalDate === journalDate
      );
      
      if (existingJournal) {
        // 如果已存在，直接导航到该日记
        console.log('Found existing journal, navigating to:', existingJournal.slugId);
        navigate(`/s/${spaceSlug}/p/${existingJournal.slugId}`, { replace: true });
        return;
      }
    }

    console.log('Creating new page with journal date:', journalDate);
    hasCreated.current = true;
    
    const createPageData = {
      spaceId: space.id,
      title: journalDate ? `${journalDate} 日记` : undefined,
      icon: journalDate ? '📝' : undefined,
      isJournal: !!journalDate,
      journalDate: journalDate || undefined,
    };

    createPageMutation.mutate(createPageData, {
      onSuccess: (page) => {
        navigate(`/s/${spaceSlug}/p/${page.slugId}`, { 
          state: { isNewPage: true },
          replace: true 
        });
      },
      onError: async (error: any) => {
        console.error('创建页面失败:', error);
        
        // 如果是因为该日期已有日记的错误，重新检查并导航
        if (journalDate && error?.response?.data?.message?.includes('该日期已有日记')) {
          console.log('检测到该日期已有日记，重新获取最新数据...');
          
          try {
            // 强制重新获取日记列表
            await queryClient.invalidateQueries({ queryKey: ["journals", space.id] });
            const response = await api.post('/pages/journal/list', {
              spaceId: space.id,
              page: 1,
              limit: 100,
              includeContent: false,
            });
            
            // 处理响应数据
            let updatedJournals = [];
            const data = response.data;
            if (Array.isArray(data)) {
              updatedJournals = data;
            } else if (data && Array.isArray(data.items)) {
              updatedJournals = data.items;
            } else if (data && Array.isArray(data.data)) {
              updatedJournals = data.data;
            }
            
            // 查找对应日期的日记
            const existingJournal = updatedJournals.find(
              (journal: any) => journal.isJournal && journal.journalDate === journalDate
            );
            
            if (existingJournal) {
              // 找到了，导航到该日记
              console.log('找到现有日记，导航到:', existingJournal.slugId);
              navigate(`/s/${spaceSlug}/p/${existingJournal.slugId}`, { replace: true });
              return;
            } else {
              console.log('重新检查后仍未找到日记，停止操作');
              navigate(`/s/${spaceSlug}`, { replace: true });
              return;
            }
          } catch (refreshError) {
            console.error('重新获取日记数据失败:', refreshError);
          }
        }
        
        showNotification({
          title: t('error'),
          message: journalDate ? '创建日记失败' : '创建页面失败',
          color: 'red',
        });
        navigate(`/s/${spaceSlug}`, { replace: true });
      },
    });
  }, [spaceSlug, searchParams, currentUser, space, journals, journalsLoading, navigate, t]);

  // 显示加载状态
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div>{createPageMutation.isPending ? '正在创建页面...' : '准备创建页面...'}</div>
    </div>
  );
}