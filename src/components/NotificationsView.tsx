import React from 'react';
import { Trophy, Heart, Sparkles, MessageCircle, Crown, Shield } from 'lucide-react';
import { User, Language, AppNotification } from '../types';
import { translations } from '../translations';

interface NotificationsViewProps {
  currentUser: User;
  language: Language;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  currentUser,
  language,
}) => {
  const t = translations[language];

  const notifications: AppNotification[] = [
    {
      id: 'notif_1',
      userId: currentUser.id,
      type: 'pioneer',
      titleEn: `Pioneer Priority Assigned: Account #${currentUser.accountNumber}`,
      titleAr: `تم تثبيت أولوية ريادتك: الحساب رقم #${currentUser.accountNumber}`,
      messageEn: 'Your pioneer tier badge is live on your profile across the cosmos.',
      messageAr: 'شارة الرائد الخاصة بك مفعلة الآن في ملفك الشخصي وتظهر للجميع.',
      createdAt: 'Just now',
      read: false,
    },
    {
      id: 'notif_2',
      userId: currentUser.id,
      type: 'award',
      titleEn: 'Comedy Season 2026 is Active!',
      titleAr: 'موسم الكوميديا 2026 نشط الآن!',
      messageEn: 'Post your 15s comedy clips to enter the race for Best Comedy Video of the Year.',
      messageAr: 'انشر مقاطعك الكوميدية بطول 15 ثانية للمنافسة على جائزة أفضل فيديو كوميدي للسنة.',
      createdAt: '1 hour ago',
      read: true,
    },
    {
      id: 'notif_3',
      userId: currentUser.id,
      type: 'founder',
      titleEn: 'Welcome from Hussein Ali Yousef',
      titleAr: 'رسالة ترحيب من حسين علي يوسف',
      messageEn: 'Welcome to Five Seasons. Enjoy crafting your 15-second Clips.',
      messageAr: 'أهلاً بك في فصول خمسة. نتمنى لك تجربة ممتعة في صناعة المقاطع.',
      createdAt: 'Today',
      read: true,
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'pioneer':
        return <Crown className="w-5 h-5 text-fuchsia-400" />;
      case 'award':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'founder':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Heart className="w-5 h-5 text-pink-400" />;
    }
  };

  return (
    <div
      id="notifications-view"
      className="w-full max-w-2xl mx-auto px-4 py-6 md:py-8 text-white"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-black text-white mb-1">
          {t.notifications}
        </h2>
        <p className="text-xs text-zinc-400">
          {language === 'ar' ? 'آخر التحديثات والتصويتات وشارات الرواد' : 'Latest updates, votes, and pioneer awards'}
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="p-4 rounded-2xl cosmic-glass border border-purple-500/20 flex items-start gap-3.5 hover:border-purple-400/40 transition-all"
          >
            <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex-shrink-0">
              {getIcon(n.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-bold text-xs text-white">
                  {language === 'ar' ? n.titleAr : n.titleEn}
                </h4>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {n.createdAt}
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                {language === 'ar' ? n.messageAr : n.messageEn}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
