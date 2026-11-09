import React, { useState } from 'react';
import {
  Library,
  Plus,
  Search,
  ExternalLink,
  BookOpen,
  Globe,
  FileText,
  Video,
  Trash2,
  Tag,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { LifeArea, ResourceItem } from '../../types';

export const ResourcesView: React.FC = () => {
  const { state, addResource, deleteResource } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [resourceType, setResourceType] = useState<ResourceItem['resourceType']>('website');
  const [category, setCategory] = useState<LifeArea>('education');

  const filteredResources = state.resources.filter(r => {
    if (typeFilter !== 'all' && r.resourceType !== typeFilter) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addResource({
      title: title.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      resourceType,
      category,
      tags: ['reference'],
    });

    setTitle('');
    setDescription('');
    setUrl('');
    setShowAddModal(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-[#D2925B]" />;
      case 'video':
        return <Video className="w-4 h-4 text-[#B9534F]" />;
      case 'article':
      case 'document':
      case 'pdf':
        return <FileText className="w-4 h-4 text-[#868A7A]" />;
      default:
        return <Globe className="w-4 h-4 text-[#5B8C67]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-[#F4F0E9] tracking-tight">
            Reference Vault & Knowledge Library
          </h1>
          <p className="text-xs text-[#A8A8A2]">
            Repository of technical books, research papers, documentation sites, and course materials.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Save Resource</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#2E373F] border border-[#434D56]/60 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#868A7A] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search vault references..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="website">Websites</option>
            <option value="book">Books</option>
            <option value="article">Articles</option>
            <option value="pdf">PDFs</option>
            <option value="video">Videos</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            <option value="education">Education</option>
            <option value="career">Career</option>
            <option value="fitness">Fitness</option>
            <option value="personal_development">Personal</option>
          </select>
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(res => (
          <div
            key={res.id}
            className="p-5 rounded-xl bg-[#2E373F] border border-[#434D56]/60 hover:border-[#D2925B]/50 transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-[#242B31] border border-[#434D56]">
                    {getIcon(res.resourceType)}
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#242B31] text-[#868A7A]">
                    {res.resourceType}
                  </span>
                </div>
                <button
                  onClick={() => deleteResource(res.id)}
                  className="text-[#868A7A] hover:text-[#E57373] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete resource"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-sm font-semibold text-[#F4F0E9] group-hover:text-[#D2925B] transition-colors">
                {res.title}
              </h3>

              {res.description && (
                <p className="text-xs text-[#A8A8A2] leading-relaxed line-clamp-2">
                  {res.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#434D56]/40 text-xs">
              <span className="text-[10px] text-[#868A7A] capitalize">{res.category}</span>
              {res.url ? (
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#D2925B] hover:underline font-mono text-[11px]"
                >
                  <span>Open Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[10px] text-[#868A7A]">Local doc</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-[#242B31] border border-[#434D56] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-[#434D56] bg-[#22292F] flex items-center justify-between">
              <span className="text-xs font-bold text-[#F4F0E9]">Save to Resource Vault</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#868A7A] hover:text-[#F4F0E9]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#A8A8A2] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Designing Data-Intensive Applications"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A8A8A2] mb-1">URL (Optional)</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#A8A8A2] mb-1">Type</label>
                  <select
                    value={resourceType}
                    onChange={e => setResourceType(e.target.value as any)}
                    className="w-full px-2 py-1 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9]"
                  >
                    <option value="website">Website</option>
                    <option value="article">Article</option>
                    <option value="book">Book</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#A8A8A2] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-2 py-1 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9]"
                  >
                    <option value="education">Education</option>
                    <option value="career">Career</option>
                    <option value="fitness">Fitness</option>
                    <option value="personal_development">Personal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A8A8A2] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Notes, key takeaway, or summary..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1 text-xs text-[#868A7A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#D2925B] text-[#242B31] font-semibold text-xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
