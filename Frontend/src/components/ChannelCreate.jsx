import React, { useState } from 'react';

const EMOJI_OPTIONS = ['👥', '🚀', '💻', '📚', '⚡', '🎨', '🔬', '🎯', '💬', '🛠️', '🌐', '💡'];

const DEFAULT_CONTACTS = [
  {
    id: 'user_sarah',
    name: 'Sarah Chen',
    username: 'sarah_sec',
    role: 'Security Architect',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  },
  {
    id: 'user_alex',
    name: 'Alex Vance',
    username: 'alex_ops',
    role: 'DevOps Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  },
  {
    id: 'user_david',
    name: 'David Kim',
    username: 'david_k',
    role: 'Backend Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  },
  {
    id: 'user_priya',
    name: 'Priya Patel',
    username: 'priya_ai',
    role: 'ML Researcher',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
  },
  {
    id: 'user_marcus',
    name: 'Marcus Brody',
    username: 'marcus_b',
    role: 'Product Lead',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
  },
];

export default function ChannelCreate({
  isOpen = false,
  onClose = () => {},
  onCreate = () => {},
  contacts = DEFAULT_CONTACTS,
}) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('group'); // 'group' or 'channel'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👥');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setType('group');
    setName('');
    setDescription('');
    setSelectedEmoji('👥');
    setSelectedMemberIds([]);
    setSearchQuery('');
    onClose();
  };

  const handleToggleMember = (contactId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMembers = contacts.filter((c) => selectedMemberIds.includes(c.id));

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      id: `room-${Date.now()}`,
      name: type === 'channel' ? `#${name.trim().toLowerCase().replace(/\s+/g, '-')}` : name.trim(),
      description: description.trim(),
      icon: selectedEmoji,
      isChannel: type === 'channel',
      isEncrypted: true,
      members: selectedMembers,
      memberCount: selectedMembers.length + 1,
      createdAt: new Date().toISOString(),
    });

    handleReset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[90vh]">
        {/* WhatsApp Styled Modal Header */}
        <header className="px-5 py-4 bg-[#075E54] dark:bg-[#128C7E] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedEmoji}</span>
            <div>
              <h2 className="font-semibold text-lg leading-tight">
                {step === 1 && `New ${type === 'channel' ? 'Channel' : 'Group'}`}
                {step === 2 && 'Add Group Members'}
                {step === 3 && 'Confirm & Create'}
              </h2>
              <p className="text-xs text-white/80">
                Step {step} of 3 • {step === 1 ? 'Details' : step === 2 ? 'Contacts' : 'Review'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-black/10 transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Progress Stepper Bar */}
        <div className="flex h-1 bg-zinc-200 dark:bg-zinc-800">
          <div
            className="bg-[#25D366] transition-all duration-300 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body Steps */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-zinc-800 dark:text-zinc-100">
          {/* STEP 1: Name, Description, Type & Emoji Picker */}
          {step === 1 && (
            <div className="space-y-5 animate-slideIn">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Space Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType('group');
                      if (selectedEmoji === '📢') setSelectedEmoji('👥');
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                      type === 'group'
                        ? 'border-[#25D366] bg-[#25D366]/10 dark:bg-[#25D366]/15 text-[#075E54] dark:text-[#25D366] font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span className="text-xl">👥</span>
                    <div>
                      <div className="text-sm font-medium">Private Group</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                        Team conversations & collaborative threads
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setType('channel');
                      if (selectedEmoji === '👥') setSelectedEmoji('📢');
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                      type === 'channel'
                        ? 'border-[#25D366] bg-[#25D366]/10 dark:bg-[#25D366]/15 text-[#075E54] dark:text-[#25D366] font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span className="text-xl">📢</span>
                    <div>
                      <div className="text-sm font-medium">Public Channel</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                        Broadcasts, announcements & open topics
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Emoji Icon Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Select Icon Avatar
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition ${
                        selectedEmoji === emoji
                          ? 'bg-[#25D366] text-white scale-110 shadow-md ring-2 ring-[#25D366]/40'
                          : 'bg-zinc-100 dark:bg-[#2A3942] hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    {type === 'channel' ? 'Channel Name' : 'Group Name'} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">{name.length}/40</span>
                </div>
                <div className="relative">
                  {type === 'channel' && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400">#</span>
                  )}
                  <input
                    type="text"
                    maxLength={40}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={type === 'channel' ? 'engineering-updates' : 'Sprint Planning Alpha'}
                    className={`w-full py-2.5 bg-zinc-100 dark:bg-[#2A3942] text-sm text-zinc-900 dark:text-white rounded-xl border border-transparent focus:border-[#25D366] focus:outline-hidden transition ${
                      type === 'channel' ? 'pl-8 pr-3' : 'px-3.5'
                    }`}
                  />
                </div>
              </div>

              {/* Description Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Description (Optional)
                  </label>
                  <span className="text-[11px] text-zinc-400">{description.length}/140</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={140}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an overview of the topic or purpose for participants..."
                  className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-[#2A3942] text-sm text-zinc-900 dark:text-white rounded-xl border border-transparent focus:border-[#25D366] focus:outline-hidden resize-none transition"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Add Members with Search & Checkboxes */}
          {step === 2 && (
            <div className="space-y-4 animate-slideIn">
              {/* Search Bar */}
              <div className="relative">
                <svg
                  className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts by name, handle or role..."
                  className="w-full pl-9 pr-3.5 py-2 bg-zinc-100 dark:bg-[#2A3942] text-sm text-zinc-900 dark:text-white rounded-xl border border-transparent focus:border-[#25D366] focus:outline-hidden transition"
                />
              </div>

              {/* Selected Pills */}
              {selectedMembers.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[#075E54] dark:text-[#25D366] mb-1.5 uppercase">
                    Selected ({selectedMembers.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {selectedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#25D366]/15 dark:bg-[#25D366]/20 text-zinc-800 dark:text-zinc-200 rounded-full text-xs font-medium border border-[#25D366]/40"
                      >
                        <img src={m.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                        <span>{m.name.split(' ')[0]}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleMember(m.id)}
                          className="hover:text-red-500 font-bold ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact List */}
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredContacts.length === 0 ? (
                  <p className="text-center text-xs text-zinc-400 py-6">No matching contacts found</p>
                ) : (
                  filteredContacts.map((contact) => {
                    const isSelected = selectedMemberIds.includes(contact.id);
                    return (
                      <div
                        key={contact.id}
                        onClick={() => handleToggleMember(contact.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#25D366]/10 dark:bg-[#25D366]/15'
                            : 'hover:bg-zinc-50 dark:hover:bg-[#2A3942]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                          />
                          <div>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                              {contact.name}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              @{contact.username} • {contact.role}
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                            isSelected
                              ? 'bg-[#25D366] border-[#25D366] text-white'
                              : 'border-zinc-300 dark:border-zinc-600 bg-transparent'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Review and Create */}
          {step === 3 && (
            <div className="space-y-5 animate-slideIn">
              <div className="p-4 bg-zinc-50 dark:bg-[#2A3942]/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#075E54] dark:bg-[#128C7E] text-white text-3xl flex items-center justify-center shadow-md shrink-0">
                  {selectedEmoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                      {type === 'channel' ? `#${name.trim().toLowerCase().replace(/\s+/g, '-')}` : name}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#25D366]/20 text-[#075E54] dark:text-[#25D366]">
                      {type === 'channel' ? 'PUBLIC' : 'PRIVATE'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Members Preview */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Invited Participants ({selectedMembers.length + 1})
                </h4>
                <div className="flex items-center -space-x-2 overflow-hidden py-1">
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#1F2C34] bg-[#25D366] text-white text-xs font-bold flex items-center justify-center">
                    You
                  </div>
                  {selectedMembers.slice(0, 7).map((m) => (
                    <img
                      key={m.id}
                      src={m.avatar}
                      alt={m.name}
                      title={m.name}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#1F2C34] object-cover"
                    />
                  ))}
                  {selectedMembers.length > 7 && (
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#1F2C34] bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center">
                      +{selectedMembers.length - 7}
                    </div>
                  )}
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <div className="text-xs text-emerald-800 dark:text-emerald-300">
                  <span className="font-semibold">Web Crypto ECDH & AES-GCM Encrypted:</span> All room communications will be secure and synced across devices.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <footer className="p-4 bg-zinc-50 dark:bg-[#1F2C34] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition"
            >
              ← Back
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !name.trim()}
              onClick={() => setStep((s) => s + 1)}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition ${
                step === 1 && !name.trim()
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                  : 'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-md'
              }`}
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="px-6 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs rounded-xl shadow-md transition transform active:scale-95"
            >
              Create {type === 'channel' ? 'Channel' : 'Group'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
