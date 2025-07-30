import { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useCreatePageMutation } from '@/features/page/queries/page-query';
import { useGetSpaceBySlugQuery } from '@/features/space/queries/space-query';
import { useGetJournalsQuery } from '@/features/journal/queries/journal-query';
import useCurrentUser from '@/features/user/hooks/use-current-user';
import { showNotification } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

export default function NewPage() {
  const { t } = useTranslation();
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
      onError: (error) => {
        console.error('创建页面失败:', error);
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