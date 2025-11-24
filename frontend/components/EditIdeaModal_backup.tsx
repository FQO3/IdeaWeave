'use client';

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

interface EditIdeaModalProps {
  idea: any;
  onSave: (content: string, tags: string[]) => void;
  onCancel: () => void;
}

export default function EditIdeaModal({ idea, onSave, onCancel }: EditIdeaModalProps) {
  const [content, setContent] = useState(idea.content);
  const [tags, setTags] = useState<string[]>([]);

  // 解析内容中的标签
  useEffect(() => {
    if (idea.tags && idea.tags.length > 0) {
      // 如果有现有标签，显示标签
      const tagNames = idea.tags.map((tag: any) => tag.name);
      setTags(tagNames);
    }
  }, [idea]);

  // 构建保存内容
  const buildSaveContent = () => {
    return content;
  };

  const handleSave = () => {
    const saveContent = buildSaveContent();
    onSave(saveContent, tags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // 添加标签
  const addTag = (tagName: string) => {
    if (tags.length >= 5) return;
    const cleanTag = tagName.replace(/[^\w\u4e00-\u9fa5]/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
  };

  // 删除标签
  const removeTag = (index: number) => {
    if (tags.length <= 1) return; // 至少保留一个标签
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 内容编辑器 */}
      <div className="flex-1 mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full min-h-[400px] p-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="写下你的想法..."
          autoFocus
        />
      </div>

      {/* 标签区域 */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">标签:</span>
          <div className="flex flex-wrap gap-2">
                                                    {tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                            >
                                                🏷️ {tag}
                                                {tags.length > 1 && (
                                                    <button
                                                        onClick={() => removeTag(index)}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </span>
                                        ))}
            {tags.length < 5 && (
              <input
                type="text"
                placeholder="添加标签..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="px-2 py-1 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-full bg-transparent focus:outline-none focus:border-blue-500"
              />
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          提示：使用输入框添加标签，最多5个，最少1个。按 Ctrl+Enter 保存。
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          保存
        </button>
      </div>
    </div>
  );
}