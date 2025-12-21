import { ddloaderHtml } from 'common/spinner';
import { i18n } from './i18n';

interface AISearchResult {
  detectedLanguage: string;
  confidence: number;
}

interface Translator {
  translate(text: string): Promise<string>;
  destroy(): void;
}

interface LanguageDetector {
  detect(text: string): Promise<AISearchResult[]>;
  destroy(): void;
}

declare global {
  const Translator: {
    create(options: any): Promise<Translator>;
    availability(
      options: any,
    ): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
  };
  const LanguageDetector: {
    create(options?: any): Promise<LanguageDetector>;
  };
  interface Navigator {
    connection?: {
      saveData: boolean;
      type: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
    };
  }
}

export async function setupTranslator(textSelector: string) {
  const isMetered =
    navigator.connection?.saveData === true || navigator.connection?.type === 'cellular';
  const isSupported = typeof Translator !== 'undefined' && typeof LanguageDetector !== 'undefined';

  if (!isSupported || isMetered) return;

  document.body.classList.add('translator-enabled');

  const targetLang = document.documentElement.lang || 'en';
  const textElements = document.querySelectorAll<HTMLElement>(textSelector);

  let detector: LanguageDetector | null = null;

  try {
    detector = await LanguageDetector.create();

    for (const el of Array.from(textElements)) {
      if (el.nextElementSibling?.classList.contains('translator-container')) continue;

      let cleanText = el.innerText.trim();
      if (!cleanText) return;
      // just double the text if it's too short
      if (cleanText.length < 15) cleanText = `${cleanText}\n${cleanText}`;

      const results = await detector.detect(cleanText);
      const sourceLang = results[0]?.detectedLanguage;

      if (sourceLang && sourceLang !== 'und' && sourceLang !== targetLang) {
        const container = document.createElement('div');
        container.className = 'translator-container';
        el.dataset.sourceLang = sourceLang;

        const btn = document.createElement('a');
        btn.className = 'translate-btn';
        btn.textContent = i18n('translate');
        btn.addEventListener('click', buttonClick);

        container.appendChild(btn);
        el.insertAdjacentElement('afterend', container);
      }
    }
  } catch (e) {
    console.error('Language detection setup failed', e);
  } finally {
    if (detector) detector.destroy();
  }

  async function buttonClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.matches('.translator-container .translate-btn')) return;

    e.preventDefault();

    const container = target.closest('.translator-container') as HTMLElement;
    const messageElement = container.previousElementSibling as HTMLElement;

    if (!container || !messageElement) return;

    let translator: Translator | null = null;

    try {
      container.innerHTML = ddloaderHtml;
      const progressLabel = document.createElement('small');
      progressLabel.className = 'translator-progress-label';
      container.appendChild(progressLabel);

      const cleanText = messageElement.innerText.trim();
      const sourceLang = messageElement.dataset.sourceLang || 'en';

      const availability = await Translator.availability({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      });

      if (availability === 'unavailable') {
        container.innerHTML = '<span class="translator-error">Translation unavailable.</span>';
        return;
      }

      console.debug(`Translating from ${sourceLang} to ${targetLang}:\n`, cleanText);
      translator = await Translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        monitor(m: any) {
          m.addEventListener('downloadprogress', (p: any) => {
            const pct = Math.floor((p.loaded / (p.total || 1)) * 100);
            // to not show percentages on subsequent runs
            if (pct > 0 && pct < 100) {
              progressLabel.textContent = `${pct}%`;
            } else {
              progressLabel.textContent = '';
            }
          });
        },
      });

      const result = await translator.translate(cleanText);

      const resultEl = document.createElement('div');
      resultEl.className = 'translated-text';
      resultEl.textContent = result;

      container.innerHTML = '';
      container.appendChild(resultEl);
    } catch (err) {
      console.error('Translation Error:', err);
      container.innerHTML = '<span class="translator-error">Failed.</span>';
    } finally {
      if (translator) translator.destroy();
    }
  }
}
