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
  
  // We want Tajweed, English (Asad), Urdu (Jalandhry), and Audio (Alafasy)
  const editions = 'quran-tajweed,en.asad,ur.jalandhry,ar.alafasy';

  for (const i of PARA_30_SURAHS) {
    const filename = path.join(OUTPUT_DIR, `${i}.json`);
    
    // Simple idempotency check
    if (await fs.pathExists(filename)) {
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
    const url = `https://api.alquran.cloud/v1/surah/${i}/editions/${editions}`;
    const data = await fetchWithRetry(url);

    if (data.code !== 200 || !data.data || data.data.length !== 4) {
      throw new Error(`Invalid response for surah ${i}`);
    }

    const [tajweedData, englishData, urduData, audioData] = data.data;

    // Combine ayahs
    const combinedAyahs = tajweedData.ayahs.map((ayah, index) => {
      return {
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        manzil: ayah.manzil,
        page: ayah.page,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
        sajda: ayah.sajda,
        text: ayah.text, // Contains tajweed tags
        translation: {
          en: englishData.ayahs[index].text,
          ur: urduData.ayahs[index].text
        },
        audio: audioData.ayahs[index].audio,
        audioSecondary: audioData.ayahs[index].audioSecondary
      };
    });

    const surahDoc = {
      number: tajweedData.number,
      name: tajweedData.name,
      englishName: tajweedData.englishName,
      englishNameTranslation: tajweedData.englishNameTranslation,
      revelationType: tajweedData.revelationType,
      numberOfAyahs: tajweedData.numberOfAyahs,
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
