import React from 'react';
import { ArticlesDashboardTab } from './ArticlesDashboardTab';
import { ArticleEditorView } from './ArticleEditorView';

interface ArticlesManagementViewProps {
  editArticleId: number | null | undefined; // undefined = list view, null = create new, number = edit existing
  onOpenEditor: (articleId?: number | null) => void;
  onCloseEditor: () => void;
}

export const ArticlesManagementView: React.FC<ArticlesManagementViewProps> = ({
  editArticleId,
  onOpenEditor,
  onCloseEditor
}) => {
  if (editArticleId !== undefined) {
    return (
      <ArticleEditorView
        articleId={editArticleId}
        onBack={onCloseEditor}
        onSaved={(savedId) => onOpenEditor(savedId)}
      />
    );
  }

  return <ArticlesDashboardTab onOpenEditor={(id) => onOpenEditor(id ?? null)} />;
};

