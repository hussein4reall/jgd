import React, { useState } from 'react';
import { Send, MessageSquare, Search, Sparkles, User as UserIcon, CheckCheck } from 'lucide-react';
import { User, Language, DirectMessage } from '../types';
import { translations } from '../translations';
import { PioneerBadge } from './PioneerBadge';

interface MessagesViewProps {
  currentUser: User;
  language: Language;
  allUsers?: User[];
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  currentUser,
  language,
  allUsers = [],
}) => {
  const t = translations[language];

  // Only other real users from Firestore
  const realContacts = allUsers.filter((u) => u.id !== currentUser.id);

  const [selectedContactId, setSelectedContactId] = useState<string>(
    realContacts[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [messagesMap, setMessagesMap] = useState<Record<string, DirectMessage[]>>({});
  const [inputText, setInputText] = useState('');

  const filteredContacts = realContacts.filter(
    (c) =>
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedContact = realContacts.find((c) => c.id === selectedContactId) || realContacts[0];
  const activeMessages = selectedContact ? (messagesMap[selectedContact.id] || []) : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact) return;

    const currentMsgText = inputText.trim();
    const newMsg: DirectMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      receiverId: selectedContact.id,
      text: currentMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFromMe: true,
    };

    const targetContactId = selectedContact.id;
    setMessagesMap((prev) => ({
      ...prev,
      [targetContactId]: [...(prev[targetContactId] || []), newMsg],
    }));

    setInputText('');
  };

  return (
    <div
      id="messages-view"
      className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 md:py-6 text-white h-[calc(100vh-140px)] flex flex-col md:flex-row gap-3 md:gap-4"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Left Column: Direct Messages Contact List */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col rounded-3xl cosmic-glass border border-white/10 p-3.5 overflow-hidden">
        {/* Messages Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">
              {t.messages}
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
            {realContacts.length} {language === 'ar' ? 'أعضاء' : 'Members'}
          </span>
        </div>

        {/* Search Contacts */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث في الأعضاء...' : 'Search members...'}
            className="w-full bg-white/5 border border-white/10 focus:border-purple-400 rounded-xl py-2 pl-9 pr-3 rtl:pl-3 rtl:pr-9 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-all"
          />
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <UserIcon className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-400">
                {language === 'ar' ? 'لا يوجد أعضاء آخرين بعد' : 'No other members yet'}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                {language === 'ar' ? 'سيظهر هنا المبدعون عند تسجيلهم' : 'Creators will appear once registered'}
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = selectedContact && contact.id === selectedContact.id;
              return (
                <button
                  key={contact.id}
                  id={`chat-contact-${contact.id}`}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all text-left rtl:text-right ${
                    isSelected
                      ? 'bg-purple-600/30 border border-purple-400/40 text-white shadow-md'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border border-transparent text-zinc-300'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={contact.avatarUrl}
                      alt={contact.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white truncate">
                        {contact.displayName}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      @{contact.username}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation Window */}
      <div className="flex-1 flex flex-col rounded-3xl cosmic-glass border border-white/10 p-3.5 md:p-4 overflow-hidden">
        {selectedContact ? (
          <>
            {/* Active Contact Header */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between mb-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedContact.avatarUrl}
                    alt={selectedContact.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-purple-400/40"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-white">
                      {selectedContact.displayName}
                    </h3>
                    <PioneerBadge
                      tier={selectedContact.pioneerTier}
                      accountNumber={selectedContact.accountNumber}
                      language={language}
                      size="sm"
                    />
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    @{selectedContact.username}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Thread Container */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 mb-3 flex flex-col">
              {activeMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                  <Sparkles className="w-8 h-8 text-purple-400/50 mb-2" />
                  <p className="text-xs text-zinc-300">
                    {language === 'ar' ? 'ابدأ محادثة جديدة مع ' + selectedContact.displayName : 'Start a conversation with ' + selectedContact.displayName}
                  </p>
                </div>
              ) : (
                activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${
                      msg.isFromMe ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.isFromMe
                          ? 'btn-space-primary text-white rounded-br-none rtl:rounded-bl-none rtl:rounded-br-2xl shadow-md'
                          : 'bg-white/10 border border-white/10 text-zinc-100 rounded-bl-none rtl:rounded-br-none rtl:rounded-bl-2xl backdrop-blur-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {msg.timestamp}
                      </span>
                      {msg.isFromMe && <CheckCheck className="w-3 h-3 text-purple-400" />}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.typeMessage}
                className="flex-1 bg-black/60 border border-white/15 focus:border-purple-400 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none backdrop-blur-md transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-5 py-3 rounded-2xl btn-space-primary font-bold text-xs text-white disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <span>{t.send}</span>
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
            <MessageSquare className="w-12 h-12 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">
              {language === 'ar' ? 'لا توجد محادثات' : 'No Active Conversations'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              {language === 'ar'
                ? 'ستظهر هنا رسائلك عند التواصل مع مبدعي فصول خمسة.'
                : 'Your messages will appear here when communicating with Five Seasons creators.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
