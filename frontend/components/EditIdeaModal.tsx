'use client';

import { useState, useEffect } from 'react';
import { Save, X, Tag, Edit2, Plus } from 'lucide-react';
import api from '@/lib/api';

interface EditIdeaModalProps {
  idea: any;
  onSave: (content: string, tags: string[]) => void;
  onCancel: () => void;
}

export default function EditIdeaModal({ idea, onSave, onCancel }: EditIdeaModalProps) {
  const [content, setContent] = useState(idea.content);
  const [tags, setTags] = useState<string[]>([]);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [newTagName, setNewTagName] = useState('');

  // 初始化标签
  useEffect(() => {
    if (idea.tags && idea.tags.length > 0) {
      setTags(idea.tags.map((tag: any) => tag.name));
    }
  }, [idea]);

  const handleSave = () => {
    onSave(content, tags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // 添加标签
  const addTag = () => {
    if (tags.length >= 5) return;
    const cleanTag = newTagName.trim().replace(/[^\w\u4e00-\u9fa5]/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setNewTagName('');
    }
  };

  // 删除标签
  const removeTag = (index: number) => {
    if (tags.length <= 1) return; // 至少保留一个标签
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  // 开始编辑标签
  const startEditingTag = (index: number) => {
    setEditingTagIndex(index);
  };

  // 完成编辑标签
  const finishEditingTag = (index: number, newName: string) => {
    const cleanTag = newName.trim().replace(/[^\w\u4e00-\u9fa5]/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      const newTags = [...tags];
      newTags[index] = cleanTag;
      setTags(newTags);
    }
    setEditingTagIndex(null);
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

      {/* 标签编辑区域 */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">标签:</span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <div key={index} className="flex items-center gap-1">
                {editingTagIndex === index ? (
                  <input
                    type="text"
                    defaultValue={tag}
                    onBlur={(e) => finishEditingTag(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        finishEditingTag(index, e.currentTarget.value);
                      } else if (e.key === 'Escape') {
                        setEditingTagIndex(null);
                      }
                    }}
                    className="px-3 py-2 text-sm border border-blue-500 rounded-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-xs sm:px-2 sm:py-1"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <span 
                      onClick={() => startEditingTag(index)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 sm:text-xs sm:px-2 sm:py-1"
                    >
                      {tag}
                    </span>
                    {tags.length > 1 && (
                      <button
                        onClick={() => removeTag(index)}
                        className="w-5 h-5 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors sm:w-4 sm:h-4"
                      >
                        <X className="w-4 h-4 sm:w-3 sm:h-3 pl-1" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {tags.length < 5 && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addTag();
                    }
                  }}
                  placeholder="新标签..."
                  className="px-3 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-full bg-transparent focus:outline-none focus:border-blue-500 sm:text-xs sm:px-2 sm:py-1"
                />
                <button
                  onClick={addTag}
                  disabled={!newTagName.trim()}
                  className="text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed sm:scale-125"
                >
                  <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          提示：最多5个标签，最少1个标签。点击标签编辑，点击×删除标签。
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