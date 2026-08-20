// Safe, quota-aware Local Storage utility with automatic fallback and compaction

export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error(`[Storage] Error reading key "${key}":`, e);
    return null;
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`[Storage] Error removing key "${key}":`, e);
  }
}

export function cleanupLegacyStorageKeys(): void {
  if (typeof window === 'undefined') return;
  const legacyKeys = [
    'electrical_review_pro_quizzes',
    'electrical_review_pro_attempts',
    'electrical_review_pro_schedules',
    'ai_quiz_generator_quizzes',
    'ai_quiz_generator_attempts',
    'ai_quiz_generator_schedules',
  ];
  for (const k of legacyKeys) {
    try {
      localStorage.removeItem(k);
    } catch (_) {}
  }
}

export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`[Storage] Storage quota exceeded while writing "${key}". Initiating auto-recovery...`, e);

    // 1. Clean up old legacy keys to free storage space
    cleanupLegacyStorageKeys();

    // 2. Clean up temporary unsubmitted attempt caches if any
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('quiz_attempt_')) {
          localStorage.removeItem(k);
        }
      }
    } catch (_) {}

    // 3. Retry standard write
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.warn(`[Storage] Retrying with compressed payload for "${key}"...`);
    }

    // 4. Compact attempts if writing attempts
    if (key === 'board_exam_review_pro_attempts') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          // Keep at most 30 recent attempts and strip duplicate heavy data from activeQuestions
          const compacted = parsed.slice(0, 30).map((att: any) => {
            if (att.activeQuestions && Array.isArray(att.activeQuestions)) {
              return {
                ...att,
                activeQuestions: att.activeQuestions.map((q: any) => ({
                  id: q.id,
                  number: q.number,
                  text: q.text,
                  type: q.type,
                  choices: q.choices,
                  correctAnswer: q.correctAnswer,
                  category: q.category,
                  subject: q.subject
                }))
              };
            }
            return att;
          });

          localStorage.setItem(key, JSON.stringify(compacted));
          return true;
        }
      } catch (e3) {
        // Fallback to top 15 attempts without activeQuestions
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            const ultraCompact = parsed.slice(0, 15).map((att: any) => {
              const { activeQuestions, ...rest } = att;
              return rest;
            });
            localStorage.setItem(key, JSON.stringify(ultraCompact));
            return true;
          }
        } catch (_) {}
      }
    }

    // 5. Compact quizzes if writing quizzes
    if (key === 'board_exam_review_pro_quizzes') {
      try {
        const parsedQuizzes = JSON.parse(value);
        if (Array.isArray(parsedQuizzes)) {
          const sanitized = parsedQuizzes.map((qz: any) => ({
            ...qz,
            questions: qz.questions.map((q: any) => ({
              ...q,
              // Strip massive base64 image strings if storage is exhausted
              image: q.image && q.image.length > 30000 ? null : q.image
            }))
          }));
          localStorage.setItem(key, JSON.stringify(sanitized));
          return true;
        }
      } catch (_) {}
    }

    // Safe silent failure - prevent fatal React error boundary crashes
    console.error(`[Storage] Unable to persist key "${key}" even after compaction. Running in-memory.`);
    return false;
  }
}
