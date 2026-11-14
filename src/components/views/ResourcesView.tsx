import React, { useState } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  BookOpen,
  Globe,
  FileText,
  Video,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../lib/context';
import { LifeArea, ResourceItem } from '../../types';
import { MOMENTUM_EASE, ModalShell } from '../common/MotionPrimitives';

export const ResourcesView: React.FC = () => {
  const { state, addResource, deleteResource, showToast } = useApp();

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
    showToast('Resource saved to vault.', 'success');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-accent" />;
      case 'video':
        return <Video className="w-4 h-4 text-danger" />;
      case 'article':
      case 'document':
      case 'pdf':
        return <FileText className="w-4 h-4 text-ink-muted" />;
      default:
        return <Globe className="w-4 h-4 text-success" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-line">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Reference Vault & Knowledge Library
          </h1>
          <p className="text-xs text-ink-muted">
            Repository of technical books, research papers, documentation sites, and course materials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn-press flex items-center gap-1.5 px-4 py-2 min-h-[44px] sm:min-h-0 rounded-xl glass-accent-pill text-xs transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Save Resource</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-line flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search vault references..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
            aria-label="Filter by resource type"
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
            className="px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
            aria-label="Filter by category"
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
        <AnimatePresence initial={false}>
          {filteredResources.map((res, idx) => (
            <motion.div
              layout
              key={res.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.2), ease: MOMENTUM_EASE }}
              className="card-hover p-5 rounded-2xl bg-surface border border-line hover:border-accent transition-colors flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-surface-warm border border-line">
                      {getIcon(res.resourceType)}
                    </div>
                    <span className="text-[10px] uppercase font-mono text-accent font-semibold">
                      {res.resourceType}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteResource(res.id);
                      showToast('Resource removed from vault.', 'info');
                    }}
                    className="btn-press text-ink-muted hover:text-danger p-1 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    title="Delete resource"
                    aria-label={`Delete ${res.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                  {res.title}
                </h3>

                {res.description && (
                  <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                    {res.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
                <span className="text-[11px] text-ink-muted capitalize">
                  {res.category.replace('_', ' ')}
                </span>
                {res.url ? (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-accent hover:underline font-mono text-[11px] font-semibold"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-ink-muted">Local doc</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Save Resource Modal */}
      <ModalShell
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidthClass="max-w-md"
      >
        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
          <span className="text-xs font-bold text-ink">Save to Resource Vault</span>
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="btn-press glass-control p-1.5 rounded-xl text-ink-muted hover:text-ink transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Designing Data-Intensive Applications"
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">URL (Optional)</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted mb-1">Type</label>
              <select
                value={resourceType}
                onChange={e => setResourceType(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
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
              <label className="block text-[11px] font-semibold text-ink-muted mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
              >
                <option value="education">Education</option>
                <option value="career">Career</option>
                <option value="fitness">Fitness</option>
                <option value="personal_development">Personal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Notes, key takeaway, or summary..."
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn-press px-3 py-1.5 rounded-xl text-xs text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-1.5 rounded-xl glass-accent-pill text-xs"
            >
              Save
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
