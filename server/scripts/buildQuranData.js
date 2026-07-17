import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'quran');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'manifest.json');

const DELAY_MS = 1000; // Be gentle to the free API
const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`Attempt ${i + 1} failed for ${url}: ${e.message}`);
      if (i === retries - 1) throw e;
      await delay(DELAY_MS * 2);
    }
  }
}

// ── Para 30 (Juz' Amma): Surah 1 (Al-Fatiha) + Surahs 78–114 ──
const PARA_30_SURAHS = [1, ...Array.from({ length: 37 }, (_, i) => 78 + i)];

async function main() {
  await fs.ensureDir(OUTPUT_DIR);

  console.log("Building Quran data for Para 30 (Juz' Amma)...");
  console.log(`Surahs to fetch: ${PARA_30_SURAHS.join(', ')}`);

  const manifest = [];
  
  const cleanTranslation = (text) => text ? text.replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/<[^>]*>/g, '').trim() : "";

  for (const i of PARA_30_SURAHS) {
    const filename = path.join(OUTPUT_DIR, `${i}.json`);
    
    // Simple idempotency check (bypassed to force rebuild)
    const FORCE_REBUILD = true;
    if (!FORCE_REBUILD && await fs.pathExists(filename)) {
      console.log(`Skipping Surah ${i} (already exists)...`);
      // We still need it in manifest, so we read it
      const existing = await fs.readJson(filename);
      manifest.push({
        number: existing.number,
        name: existing.name,
        englishName: existing.englishName,
        englishNameTranslation: existing.englishNameTranslation,
        revelationType: existing.revelationType,
        numberOfAyahs: existing.numberOfAyahs,
      });
      continue;
    }

    console.log(`Fetching Surah ${i} (${PARA_30_SURAHS.indexOf(i) + 1}/${PARA_30_SURAHS.length})...`);
    
    const chapterUrl = `https://api.quran.com/api/v4/chapters/${i}`;
    const chapterData = await fetchWithRetry(chapterUrl);
    const chapter = chapterData.chapter;

    const versesUrl = `https://api.quran.com/api/v4/verses/by_chapter/${i}?fields=text_uthmani&translations=131,20,54&audio=7&per_page=150`;
    const versesData = await fetchWithRetry(versesUrl);
    const verses = versesData.verses;

    if (!chapter || !verses) {
      throw new Error(`Invalid response for surah ${i}`);
    }

    // Combine ayahs
    const combinedAyahs = verses.map((verse) => {
      const englishText = verse.translations.find(t => t.resource_id === 131)?.text || verse.translations.find(t => t.resource_id === 20)?.text || "";
      const urduText = verse.translations.find(t => t.resource_id === 54)?.text || "";
      const audioUrl = verse.audio?.url ? (verse.audio.url.startsWith('/') ? `https://verses.quran.com${verse.audio.url}` : `https://verses.quran.com/${verse.audio.url}`) : "";

      return {
        number: verse.id,
        numberInSurah: verse.verse_number,
        juz: verse.juz_number,
        manzil: verse.manzil_number,
        page: verse.page_number,
        ruku: verse.ruku_number,
        hizbQuarter: verse.rub_el_hizb_number,
        sajda: verse.sajdah_number,
        text: verse.text_uthmani,
        translation: {
          en: cleanTranslation(englishText),
          ur: cleanTranslation(urduText)
        },
        audio: audioUrl,
        audioSecondary: ""
      };
    });

    const surahDoc = {
      number: chapter.id,
      name: chapter.name_arabic,
      englishName: chapter.name_simple,
      englishNameTranslation: chapter.translated_name.name,
      revelationType: chapter.revelation_place,
      numberOfAyahs: chapter.verses_count,
      ayahs: combinedAyahs
    };

    await fs.writeJson(filename, surahDoc, { spaces: 2 });
    
    manifest.push({
      number: surahDoc.number,
      name: surahDoc.name,
      englishName: surahDoc.englishName,
      englishNameTranslation: surahDoc.englishNameTranslation,
      revelationType: surahDoc.revelationType,
      numberOfAyahs: surahDoc.numberOfAyahs,
    });

    // Polite delay for the public API
    await delay(DELAY_MS);
  }

  await fs.writeJson(MANIFEST_FILE, manifest, { spaces: 2 });
  
  console.log(`\n=== Build Summary ===`);
  console.log(`Successfully processed ${manifest.length} surahs (Para 30).`);
  console.log(`Manifest saved to ${MANIFEST_FILE}`);
}

main().catch(e => {
  console.error("Build failed:", e);
  process.exit(1);
});
