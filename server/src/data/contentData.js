export const memberships = [
  {
    id: "Начинающий",
    title: "Начинающий",
    price: "$39",
    period: "/месяц",
    description: "Точка входа для участников, которые хотят точные тренировки, премиальное оборудование и дисциплинированный прогресс..",
    features: [
      "Неограниченный доступ к тренажёрному залу.",
      "2 групповых занятия по боксу или карате в неделю.",
      "Доступ к зоне восстановления до 17:00."
    ],
    highlight: "Лучший вариант для первых 90 дней.",
    accent: "green"
  },
  {
    id: "Про",
    title: "Про",
    price: "$79",
    period: "/месяц",
    description: "Создано для спортсменов, которые совмещают ударную технику, силовые тренировки и восстановление ..",
    features: [
      "Неограниченный доступ к залам по боксу, карате и тренировкам.",
      "Месячная оценка производительности",
      "Приоритетное бронирование классов и доступ к лаунжу"
    ],
    highlight: "Выбор большинства",
    accent: "red"
  },
  {
    id: "Элитный",
    title: "Элитный",
    price: "$149",
    period: "/месяц",
    description: "Премиум-абонемент: персональный тренер, консьерж-запись и восстановление уровня люкс..",
    features: [
      "Всё из Pro + консьерж-поддержка.",
      "4 персональные тренировки в месяц.",
      "Сауна, зона восстановления и план питания."
    ],
    highlight: "Доступ уровня основателя.",
    accent: "green"
  }
];

export const schedule = [
  { id: "пн-бокс", day: "Понедельник.", time: "06:30", className: "Основы бокса.", trainer: "Arman Sadykov", level: "Начинающий", category: "Бокс", spots: 14 },
  { id: "пн-карате", day: "Понедельник.", time: "19:00", className: "Точность карате.", trainer: "Aiko Tanaka", level: "Все уровни", category: "Карате", spots: 10 },
  { id: "вт-качалка", day: "Вторник.", time: "08:00", className: "Силовая лаборатория.", trainer: "Noah Vega", level: "Промежуточный", category: "Качалка", spots: 12 },
  { id: "ср-бокс", day: "Среда.", time: "18:30", className: "Подготовка к рингу.", trainer: "Arman Sadykov", level: "Продвинутый", category: "Бокс", spots: 16 },
  { id: "чт-карате", day: "Четверг.", time: "20:00", className: "Поток карате.", trainer: "Aiko Tanaka", level: "Все уровни", category: "Карате", spots: 12 },
  { id: "пт-качалка", day: "Пятница.", time: "17:30", className: "Двигатель спортсмена.", trainer: "Noah Vega", level: "Промежуточный", category: "Качалка", spots: 10 },
  { id: "сб-бокс", day: "Суббота.", time: "11:00", className: "Спарринг-клуб.", trainer: "Mila Hart", level: "Промежуточный", category: "Бокс", spots: 8 }
];

export const trainers = [
  {
    id: "arman",
    name: "Arman Sadykov",
    specialty: "Бокс (продвинутый уровень).",

    experience: "9 лет элитного тренерского опыта.",
    description: "Взрывную форму и чёткую работу ног для улучшения каждого раунда..",
    achievements: ["Сертифицированный тренер по физической подготовке бойцов."],
    image: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "aiko",
    name: "Aiko Tanaka",
    specialty: "Карате (экспертный уровень)",
    experience: "7 лет лидерства в доjos",
    description: "Создает точность, контроль и уверенность через кату, дисциплину и техническое повторение.",
    achievements: ["3-й дан черный пояс", "Чемпион юношеской и взрослой категорий по кате"],
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "noah",
    name: "Noah Vega",
    specialty: "Силовые системы",
    experience: "11 лет тренировки производительности",
    description: "Designs athlete-first gym programs that blend power, mobility, and recovery into one system.",
    achievements: ["Бывший колледжский тренер силы", "Специалист по производительности EXOS"],
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "mila",
    name: "Mila Hart",
    specialty: "Подготовка к бою",
    experience: "6 лет в подготовке к бою",
    description: "Known for cinematic pad work sessions, reactive drills, and high-accountability coaching.",
    achievements: ["Сертифицированный специалист по реабилитации", "Специалист по гибридной подготовке"],
    image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80"
  }
];

export const testimonials = [
  {
    id: "quote-1",
    name: "Daniel Cross",
    role: "Founder, Northline Studio",
    quote: "ALFAFitness feels like a flagship product launch translated into a training space. Every session is sharp."
  },
  {
    id: "quote-2",
    name: "Maya Chen",
    role: "Product Designer",
    quote: "The coaches, the light, the calm, the focus. It feels premium without feeling cold."
  },
  {
    id: "quote-3",
    name: "Isaac Moore",
    role: "Startup Operator",
    quote: "I joined for boxing and stayed for the system. Booking, coaching, and recovery are all frictionless."
  }
];

export const dashboardStats = [
  { label: "Действующие спортсмены.", value: "1.8K" },
  { label: "Еженедельные занятия.", value: "42" },
  { label: "Персональные тренировки.", value: "310" },
  { label: "Рейтинг членов клуба", value: "4.9/5" }
];
