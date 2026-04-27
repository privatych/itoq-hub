"use client";

import { useState, useEffect } from "react";
import { CheckSquare, RotateCcw, Sun, Calendar, Film, Palette, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContent } from "@/lib/ContentContext";
import { Checklist } from "@/lib/types";

// Parse checklist items from the actual MD files in /itoq/checklists/
const DEFAULT_CHECKLISTS: Checklist[] = [
  {
    id: "daily",
    name: "Ежедневный",
    icon: "sun",
    resetSchedule: "daily",
    lastReset: "",
    items: [
      { id: "d1", text: "TikTok For You: что виральное? (3 мин)", description: "Открой TikTok → вкладка For You. Листай 3 мин, ищи вирусные видео в нише AI/IT/tech. Цель — поймать тренд до конкурентов и адаптировать формат под ITOQ.", done: false, section: "Утро — Мониторинг" },
      { id: "d2", text: "X/Twitter: trending (3 мин)", description: "Проверь trending topics и #AI #tech хэштеги. Ищи новости, мемы, споры — всё что можно быстро переупаковать в Shorts.", done: false, section: "Утро — Мониторинг" },
      { id: "d3", text: "Product Hunt: топ дня (2 мин)", description: "Посмотри топ-5 продуктов дня. Если есть AI-инструмент — это готовая тема для обзорного Shorts: «Этот AI-инструмент заменит X».", done: false, section: "Утро — Мониторинг" },
      { id: "d4", text: "Записать 2-3 идеи в банк тем (3 мин)", description: "Из утреннего мониторинга выбери 2-3 самые цепляющие идеи → добавь в Банк идей с тегами и приоритетом. Это создаёт запас тем на 2+ недели вперёд.", done: false, section: "Утро — Мониторинг" },
      { id: "d5", text: "Опубликовать Shorts #1 (10:00)", description: "Утренний Shorts. 10:00 — пик активности аудитории (начало рабочего дня, скроллинг в перерыве). Публикуй одновременно на YouTube Shorts + TikTok + Reels.", done: false, section: "День — Контент" },
      { id: "d6", text: "Опубликовать Shorts #2 (19:00)", description: "Вечерний Shorts. 19:00 — второй пик: люди едут домой, отдыхают. Лучшее время для максимального охвата.", done: false, section: "День — Контент" },
      { id: "d7", text: "Опубликовать Shorts #3 (если есть, 14:00)", description: "Бонусный Shorts на обеденный перерыв. Необязательный, но 3 Shorts/день = 90/мес → быстрее алгоритм начинает продвигать канал.", done: false, section: "День — Контент" },
      { id: "d8", text: "Telegram: 1 пост", description: "Пост в Telegram-канал: инсайт дня, полезный совет, или ссылка на новый Shorts. Telegram — прямой контакт с ядром аудитории, самая высокая открываемость.", done: false, section: "День — Контент" },
      { id: "d9", text: "Instagram Stories (если есть контент)", description: "Закулисье, процесс работы, мемы по теме. Stories повышают видимость профиля в алгоритме Instagram и подогревают аудиторию к Reels.", done: false, section: "День — Контент" },
      { id: "d10", text: "Ответить на все комментарии (YouTube + TikTok + Instagram)", description: "Ответы в первые 1-2 часа после публикации критичны: алгоритм YouTube/TikTok считает комменты как сигнал вовлечённости и продвигает видео дальше.", done: false, section: "Вечер — Engagement" },
      { id: "d11", text: "Оставить 10-15 экспертных комментов в нише", description: "Комментируй видео других AI/IT блогеров. Не спам, а реальная экспертиза. Это привлекает их аудиторию к тебе — бесплатный трафик от каждого коммента.", done: false, section: "Вечер — Engagement" },
      { id: "d12", text: "Ответить на DM", description: "Прямые сообщения — самые лояльные подписчики. Быстрый ответ = фанат бренда. Игнор = потеря потенциального амбассадора.", done: false, section: "Вечер — Engagement" },
      { id: "d13", text: "3-5 ответов в X/Twitter", description: "Участвуй в дискуссиях, отвечай с экспертизой. X — площадка для построения личного бренда среди IT-аудитории.", done: false, section: "Вечер — Engagement" },
    ],
  },
  {
    id: "weekly",
    name: "Еженедельный",
    icon: "calendar",
    resetSchedule: "weekly",
    lastReset: "",
    items: [
      { id: "w1", text: "Заполнить отчёт недели", description: "Перейди в Аналитику → добавь неделю. Заполни: shorts/longform опубликовано, просмотры, удержание, подписчики по платформам. Это база для принятия решений.", done: false, section: "Аналитика" },
      { id: "w2", text: "Определить лучший Shorts недели", description: "Какой Shorts набрал больше всего просмотров? Почему — тема, хук, формат? Делай больше такого.", done: false, section: "Аналитика" },
      { id: "w3", text: "Определить худший Shorts недели", description: "Какой провалился? Анализируй: слабый хук, неинтересная тема, плохое время публикации? Не повторяй ошибки.", done: false, section: "Аналитика" },
      { id: "w4", text: "Обновить сводную таблицу метрик", description: "Сравни с прошлой неделей: растут просмотры? Растут подписчики? Если нет — пора менять стратегию.", done: false, section: "Аналитика" },
      { id: "w5", text: "Составить список 20 тем на след. неделю", description: "Из банка идей + мониторинг + AI генерация. 20 тем → фильтруешь до 15. Запас нужен чтобы не было «о чём снимать?» стресса.", done: false, section: "Планирование" },
      { id: "w6", text: "Выбрать 15 лучших → в банк", description: "Ранжируй по потенциалу виральности: актуальность × интерес аудитории × простота производства.", done: false, section: "Планирование" },
      { id: "w7", text: "Запланировать Long-form", description: "1 Long-form в неделю = якорный контент канала. Глубокое видео строит экспертизу и удерживает подписчиков.", done: false, section: "Планирование" },
      { id: "w8", text: "Проверить контент-банк (2 недели вперёд)", description: "Всегда имей запас готового контента на 2 недели. Это страховка от болезни, выгорания, форс-мажоров.", done: false, section: "Планирование" },
      { id: "w9", text: "vidIQ: топ ключевых слов недели", description: "vidIQ показывает что ищут на YouTube прямо сейчас. Темы с высоким поисковым объёмом = гарантированные просмотры.", done: false, section: "Мониторинг" },
      { id: "w10", text: "Google Trends: динамика запросов", description: "Проверь тренды «AI», «artificial intelligence», «chatgpt». Растущий тренд = снимай прямо сейчас, пока все ищут.", done: false, section: "Мониторинг" },
      { id: "w11", text: "Explodingtopics: новые темы", description: "Сервис находит темы ДО того как они станут мейнстримом. Раннее видео по теме = первая страница выдачи.", done: false, section: "Мониторинг" },
      { id: "w12", text: "Проанализировать 5 лучших Shorts конкурентов", description: "Загрузи обложки в Превью Studio → Анализ конкурентов. Разбери: какие хуки, какие форматы, что получило больше просмотров.", done: false, section: "Мониторинг" },
      { id: "w13", text: "AI-промпт → 20 идей → отобрать лучшие", description: "Используй Генератор: «20 идей для Shorts про AI». AI даст сырой материал → ты фильтруешь через своё понимание аудитории.", done: false, section: "Мониторинг" },
      { id: "w14", text: "Запланировать публикации на неделю", description: "Перейди в Календарь, расставь даты. Расписание дисциплинирует и помогает алгоритму (регулярность = доверие).", done: false, section: "Дистрибуция" },
      { id: "w15", text: "Подготовить описания и хэштеги", description: "Заранее подготовь SEO-описания для каждого видео. Включи ключевые слова, хэштеги, CTA. Это экономит 10-15 мин при публикации.", done: false, section: "Дистрибуция" },
    ],
  },
  {
    id: "shorts-production",
    name: "Производство Shorts",
    icon: "film",
    resetSchedule: "manual",
    lastReset: "",
    items: [
      { id: "sp1", text: "Тема выбрана из банка", description: "Не придумывай на ходу — бери готовую «горящую» тему из банка идей. Спонтанные темы в 3 раза реже становятся вирусными.", done: false, section: "Перед записью" },
      { id: "sp2", text: "Хук написан (первые 3 секунды)", description: "Хук — самый важный элемент. 70% зрителей уходят в первые 3 сек. Используй шаблоны: цифра + боль, вопрос, шок-факт.", done: false, section: "Перед записью" },
      { id: "sp3", text: "OBS настроен (сцена, звук, 1080x1920)", description: "Проверь: вертикальный формат 1080×1920, микрофон выбран, сцена с нужным layout (камера + экран или только экран).", done: false, section: "Перед записью" },
      { id: "sp4", text: "Микрофон проверен", description: "Запиши 5 секунд → прослушай. Нет фона, шипения, эха? Плохой звук = мгновенный свайп, даже если контент огонь.", done: false, section: "Перед записью" },
      { id: "sp5", text: "Начать СРАЗУ с хука (без «привет»)", description: "Никаких «Привет, сегодня я вам расскажу...». Первое слово = хук. «Этот промпт экономит 2 часа в день.»", done: false, section: "Запись" },
      { id: "sp6", text: "Энергия в голосе", description: "Голос — 50% восприятия Shorts. Говори быстрее обычного на 20%, с вариациями тона. Монотонность = свайп.", done: false, section: "Запись" },
      { id: "sp7", text: "Уложиться в 30-60 сек", description: "Оптимальная длина Shorts: 30-45 сек для максимального удержания. YouTube считает % досмотра — короче = выше процент.", done: false, section: "Запись" },
      { id: "sp8", text: "Если скринкаст — крупный шрифт, тёмная тема", description: "Shorts смотрят на телефоне. Мелкий код нечитаем. Увеличь шрифт до 20-24pt, тёмная тема контрастнее.", done: false, section: "Запись" },
      { id: "sp9", text: "Обрезать паузы и «эээ»", description: "Jump cuts каждые 2-3 секунды. Без пауз, без «эээ», без пустых кадров. Ритм должен быть как у музыкального клипа.", done: false, section: "Монтаж" },
      { id: "sp10", text: "Добавить субтитры (фирменный шрифт)", description: "85% Shorts смотрят без звука. Субтитры = обязательно. Фирменный шрифт ITOQ + neon-выделение ключевых слов.", done: false, section: "Монтаж" },
      { id: "sp11", text: "Neon-акценты на ключевых словах", description: "Визуальный код ITOQ: neon purple/cyan подсветка на «AI», «бесплатно», «секунд», цифрах. Это фирменный стиль.", done: false, section: "Монтаж" },
      { id: "sp12", text: "Первые 3 сек цепляют?", description: "Финальная проверка: пересмотри начало. Ты бы остановился листая ленту? Если нет — переделай хук.", done: false, section: "Монтаж" },
      { id: "sp13", text: "YouTube Shorts: заголовок + описание + теги", description: "Заголовок: кликбейт + ключевое слово (до 100 символов). Описание: 2-3 строки + хэштеги #shorts #ai #itoq.", done: false, section: "Публикация" },
      { id: "sp14", text: "TikTok: хэштеги + трендовый звук", description: "Добавь 3-5 нишевых хэштегов + 2 общих (#fyp #foryou). Трендовый звук даёт буст от алгоритма даже при тихом видео.", done: false, section: "Публикация" },
      { id: "sp15", text: "Instagram Reels: 3-5 хэштегов + обложка", description: "IG любит чистые обложки. Создай в Превью Studio. Хэштеги: 3-5 точных, не спам. Описание с CTA: «Сохрани себе».", done: false, section: "Публикация" },
      { id: "sp16", text: "Описание содержит @itoq_ru и ссылку", description: "Каждая публикация — точка входа в экосистему. @itoq_ru + ссылка на Telegram/YouTube в профиле.", done: false, section: "Публикация" },
    ],
  },
  {
    id: "visual-code",
    name: "Визуальный код",
    icon: "palette",
    resetSchedule: "manual",
    lastReset: "",
    items: [
      { id: "vc1", text: "Субтитры с фирменным шрифтом", description: "Шрифт Inter/Manrope Bold, белый на полупрозрачном чёрном фоне. Размер читаемый на мобильном (минимум 48px в 1080p).", done: false, section: "Перед публикацией" },
      { id: "vc2", text: "Neon-акценты на ключевых словах", description: "Purple (#A855F7) или Cyan (#06B6D4) glow на словах: AI, бесплатно, секунд, цифры. Это визуальная подпись ITOQ.", done: false, section: "Перед публикацией" },
      { id: "vc3", text: "@itoq_ru watermark (нижний правый)", description: "Логотип/ник с 30% прозрачностью. Не мешает просмотру, но защищает контент при репостах и воровстве.", done: false, section: "Перед публикацией" },
      { id: "vc4", text: "Обложка из шаблона", description: "Используй Превью Studio для генерации обложки. Единый стиль обложек = узнаваемость канала в поиске и рекомендациях.", done: false, section: "Перед публикацией" },
      { id: "vc5", text: "Фильтр/LUT применён", description: "Фирменный LUT (холодные тона, высокий контраст) на все видео. Создаёт ощущение премиум-контента.", done: false, section: "Перед публикацией" },
      { id: "vc6", text: "Разрешение: 1080x1920 (9:16)", description: "Только вертикальное 9:16 для Shorts/Reels/TikTok. Горизонтальное убивает охват на мобильных платформах.", done: false, section: "Перед публикацией" },
      { id: "vc7", text: "Интро-звук на месте", description: "Фирменный звук 0.5-1 сек в начале. Запоминающийся audio branding — зритель узнаёт ITOQ по звуку ещё до картинки.", done: false, section: "Перед публикацией" },
    ],
  },
];

const ICONS: Record<string, React.ReactNode> = {
  sun: <Sun className="w-4 h-4" />,
  calendar: <Calendar className="w-4 h-4" />,
  film: <Film className="w-4 h-4" />,
  palette: <Palette className="w-4 h-4" />,
};

export default function ChecklistsPanel() {
  const { checklists, saveChecklists } = useContent();
  const [activeId, setActiveId] = useState("daily");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Initialize defaults if empty
  useEffect(() => {
    if (checklists.length === 0) {
      saveChecklists(DEFAULT_CHECKLISTS);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-reset: daily at midnight, weekly on Monday (runs once on mount)
  const [autoResetDone, setAutoResetDone] = useState(false);
  useEffect(() => {
    if (checklists.length === 0 || autoResetDone) return;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon

    let needsUpdate = false;
    const updated = checklists.map((cl) => {
      if (cl.resetSchedule === "daily") {
        const lastDate = cl.lastReset ? cl.lastReset.split("T")[0] : "";
        if (lastDate !== todayStr) {
          needsUpdate = true;
          return { ...cl, items: cl.items.map((it) => ({ ...it, done: false })), lastReset: now.toISOString() };
        }
      }
      if (cl.resetSchedule === "weekly" && dayOfWeek === 1) {
        const lastDate = cl.lastReset ? cl.lastReset.split("T")[0] : "";
        if (lastDate !== todayStr) {
          needsUpdate = true;
          return { ...cl, items: cl.items.map((it) => ({ ...it, done: false })), lastReset: now.toISOString() };
        }
      }
      return cl;
    });
    setAutoResetDone(true);
    if (needsUpdate) saveChecklists(updated);
  }, [checklists, autoResetDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const lists = checklists.length > 0 ? checklists : DEFAULT_CHECKLISTS;
  const active = lists.find((c) => c.id === activeId) || lists[0];

  // Merge descriptions from defaults if stored checklists lack them
  const activeWithDesc = {
    ...active,
    items: active.items.map((item) => {
      if (item.description) return item;
      const defaultCl = DEFAULT_CHECKLISTS.find((cl) => cl.id === active.id);
      const defaultItem = defaultCl?.items.find((di) => di.id === item.id);
      return defaultItem?.description ? { ...item, description: defaultItem.description } : item;
    }),
  };

  function toggleItem(itemId: string) {
    const updated = lists.map((cl) =>
      cl.id === activeId
        ? { ...cl, items: cl.items.map((it) => it.id === itemId ? { ...it, done: !it.done } : it) }
        : cl
    );
    saveChecklists(updated);
  }

  function resetChecklist() {
    const updated = lists.map((cl) =>
      cl.id === activeId
        ? { ...cl, items: cl.items.map((it) => ({ ...it, done: false })), lastReset: new Date().toISOString() }
        : cl
    );
    saveChecklists(updated);
  }

  const sections = [...new Set(activeWithDesc.items.map((i) => i.section))];
  const doneCount = activeWithDesc.items.filter((i) => i.done).length;
  const totalCount = activeWithDesc.items.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="animate-slide-in">
      <h1 className="text-2xl font-bold mb-6">
        <CheckSquare className="w-6 h-6 text-neon-green inline mr-2" />
        Чек-листы
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {lists.map((cl) => {
          const d = cl.items.filter((i) => i.done).length;
          const t = cl.items.length;
          const p = t > 0 ? Math.round((d / t) * 100) : 0;
          return (
            <button
              key={cl.id}
              onClick={() => { setActiveId(cl.id); setExpandedItem(null); }}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all",
                activeId === cl.id
                  ? "border-neon-green bg-neon-green/10 text-neon-green"
                  : "border-card-border text-muted hover:text-foreground"
              )}
            >
              {ICONS[cl.icon] || <CheckSquare className="w-4 h-4" />}
              {cl.name}
              {p > 0 && p < 100 && <span className="text-[9px] ml-1 opacity-60">{p}%</span>}
              {p === 100 && <span className="text-[9px] ml-1">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Progress */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{active.name}</span>
              <span className="text-xs text-muted">{doneCount}/{totalCount}</span>
            </div>
            <div className="w-full bg-background rounded-full h-2.5">
              <div
                className={cn("h-2.5 rounded-full transition-all duration-500", progress === 100 ? "bg-neon-green" : "bg-accent")}
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <p className="text-xs text-neon-green mt-2 font-medium">Все задачи выполнены!</p>
            )}
          </div>

          {/* Sections */}
          {sections.map((section) => {
            const sectionItems = activeWithDesc.items.filter((i) => i.section === section);
            const sectionDone = sectionItems.filter((i) => i.done).length;
            return (
              <div key={section} className="bg-card border border-card-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs text-accent uppercase tracking-wider font-semibold">{section}</h3>
                  <span className="text-[10px] text-muted">{sectionDone}/{sectionItems.length}</span>
                </div>
                <div className="space-y-0.5">
                  {sectionItems.map((item) => (
                    <div key={item.id}>
                      <div
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg transition-all hover:bg-background group",
                          item.done && "opacity-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 rounded border-card-border accent-neon-green flex-shrink-0 cursor-pointer"
                        />
                        <span
                          className={cn("text-sm flex-1 cursor-pointer", item.done && "line-through text-muted")}
                          onClick={() => toggleItem(item.id)}
                        >
                          {item.text}
                        </span>
                        {item.description && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedItem(expandedItem === item.id ? null : item.id); }}
                            className="p-1 rounded text-muted/40 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                            title="Подробнее"
                          >
                            {expandedItem === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      {expandedItem === item.id && item.description && (
                        <div className="ml-10 mr-2 mb-2 p-3 bg-accent/5 border border-accent/10 rounded-lg text-xs text-muted leading-relaxed animate-slide-in">
                          {item.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <button
            onClick={resetChecklist}
            className="w-full py-3 rounded-lg bg-input-bg border border-input-border text-muted text-sm font-medium flex items-center justify-center gap-2 hover:text-foreground hover:border-accent/40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить чек-лист
          </button>

          <div className="bg-card border border-card-border rounded-xl p-4 text-xs text-muted space-y-2">
            <p><strong>Сброс:</strong> {active.resetSchedule === "daily" ? "Автоматически каждый день" : active.resetSchedule === "weekly" ? "Автоматически в понедельник" : "Вручную"}</p>
            {active.lastReset && (
              <p><strong>Последний сброс:</strong> {new Date(active.lastReset).toLocaleString("ru")}</p>
            )}
            <p className="text-[10px] opacity-60">Нажмите ▾ на пункте чтобы узнать зачем</p>
          </div>

          {/* Stats summary */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Сводка</h3>
            {lists.map((cl) => {
              const done = cl.items.filter((i) => i.done).length;
              const total = cl.items.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={cl.id} className="flex items-center justify-between py-1.5">
                  <span className="text-xs">{cl.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-background rounded-full h-1.5">
                      <div className={cn("h-1.5 rounded-full", pct === 100 ? "bg-neon-green" : "bg-accent")} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
