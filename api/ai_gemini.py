"""
AQUAVISION — Gemini Integration (Tahap 9)

Tier 6 fallback dalam pipeline AI Assistant Hubungi Admin:
  1. Classifier (classify_question)
  2. Critical Disambiguation (check_critical_disambiguation)
  3. Dynamic Intent (_DYNAMIC_INTENTS)
  4. FAQ Engine (match_faq)
  5. Glossary (lookup_glossary_term)
  6. Gemini 2.5 Flash  <-- modul ini
  7. Eskalasi ke Admin (_AI_UNSURE_TEXT + _AI_ESCALATE_OFFER)

Gemini HANYA dipanggil dari _ai_respond() (api/views.py) setelah Tier 1-5
gagal menjawab. Modul ini tidak pernah dipanggil dari tempat lain, dan
tidak mengubah perilaku Tier 1-5 sama sekali.

Modul ini didesain agar TIDAK PERNAH melempar exception ke caller: tanpa
GEMINI_API_KEY, tanpa library google-genai, timeout, error API, quota
habis, atau jawaban Gemini sendiri berupa token TIDAK_YAKIN — semuanya
mengembalikan None, yang berarti "lanjutkan ke fallback _AI_UNSURE_TEXT
seperti biasa" bagi caller. Sistem AQUAVISION tetap berjalan normal
menggunakan Tier 1-5 jika GEMINI_API_KEY tidak diset.
"""

import logging

from django.conf import settings

logger = logging.getLogger(__name__)

GEMINI_MODEL = 'gemini-2.5-flash'
GEMINI_UNSURE_TOKEN = 'TIDAK_YAKIN'
GEMINI_TIMEOUT_MS = 12_000

# Marker tak terlihat (zero-width space) yang disisipkan di AWAL jawaban
# Gemini oleh _ai_respond(), dipakai frontend (templates/hubungi.html) untuk
# menampilkan badge "🧠 Gemini" berbeda dari "🟢 Dijawab AI" (rule-based).
# Dipilih agar TIDAK perlu mengubah skema Message (tidak ada kolom baru) —
# konsisten dengan cara _AI_UNSURE_TEXT sendiri dikenali via isi teks.
GEMINI_SOURCE_MARKER = '​'

_SYSTEM_PROMPT_TEMPLATE = """Anda adalah AI Assistant AQUAVISION — sistem WebGIS untuk pemantauan dan pengelolaan sumber daya air di Desa Wonotoro, Kecamatan Sukapura, Kabupaten Probolinggo (Capstone Teknik Geodesi dan Geomatika ITB 2026).

TUGAS ANDA:
- Menjelaskan fitur sistem AQUAVISION (Dashboard, Data Portal, Simulasi Skenario, Hubungi Admin, dll).
- Menjelaskan layer peta yang tersedia (Potensi Air Tanah, Debit Puncak Aliran, Sumber Air, Tandon Air, Jaringan Pipa, Permukiman, Fasilitas Wisata, dst).
- Menjelaskan istilah hidrologi/teknis (debit, AHP, SCS-CN, neraca air, DAS, dst).
- Membantu pengguna memahami cara menggunakan dashboard.

ATURAN KETAT:
1. HANYA jawab pertanyaan yang berkaitan dengan AQUAVISION, sumber daya air Desa Wonotoro, atau topik hidrologi/GIS yang relevan.
2. JANGAN PERNAH mengarang fakta, angka, atau fitur yang tidak Anda yakini benar.
3. Jika pertanyaan di luar topik AQUAVISION, ATAU Anda tidak yakin jawabannya benar, balas HANYA dengan token berikut, tanpa kata lain apapun: TIDAK_YAKIN
4. Jawab dalam Bahasa Indonesia, singkat dan jelas (maksimal 4-5 kalimat).
5. Jangan mengaku sebagai Google atau model AI umum — Anda adalah AI Assistant AQUAVISION.

KONTEKS DATA SISTEM SAAT INI (real-time dari database):
{db_context}
"""


def _build_system_prompt(db_context_text):
    return _SYSTEM_PROMPT_TEMPLATE.format(db_context=db_context_text or '(tidak tersedia)')


def _get_client():
    """Buat Gemini client jika API key & library tersedia. Mengembalikan
    None TANPA exception jika salah satu tidak ada — caller (ask_gemini)
    memperlakukan None sebagai "Gemini tidak aktif, lanjut ke Tier 7"."""
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
    if not api_key:
        return None
    try:
        from google import genai
    except ImportError:
        logger.warning('AQUAVISION AI: library google-genai tidak terpasang — Gemini dilewati.')
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception:
        logger.exception('AQUAVISION AI: gagal membuat Gemini client.')
        return None


def is_configured():
    """True jika GEMINI_API_KEY diset DAN library google-genai tersedia
    (tidak menguji koneksi jaringan). Dipakai _ai_respond() untuk
    short-circuit: hindari query get_db_context() jika Gemini tidak aktif."""
    return _get_client() is not None


def ask_gemini(message, db_context_text):
    """Tier 6: tanya Gemini sebagai fallback terakhir sebelum eskalasi.

    Mengembalikan string jawaban (tanpa marker) jika Gemini yakin, atau
    None jika: API key tidak ada, library tidak ada, error/timeout, quota
    habis, ATAU Gemini sendiri membalas token TIDAK_YAKIN. None berarti
    "Gemini tidak menjawab" — caller (_ai_respond) jatuh ke _AI_UNSURE_TEXT.
    """
    client = _get_client()
    if client is None:
        return None

    try:
        from google.genai import types
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=message,
            config=types.GenerateContentConfig(
                system_instruction=_build_system_prompt(db_context_text),
                max_output_tokens=400,
                temperature=0.2,
                http_options=types.HttpOptions(timeout=GEMINI_TIMEOUT_MS),
            ),
        )
    except Exception as exc:
        # Sengaja menangkap SEMUA exception: timeout, error API, quota
        # habis (429), masalah jaringan, dll — semuanya jatuh ke fallback
        # lokal yang sudah terbukti aman, BUKAN crash ke pengguna.
        logger.warning('AQUAVISION AI: Gemini gagal dipanggil (%s) — fallback ke _AI_UNSURE_TEXT.', exc)
        return None

    text = (getattr(response, 'text', None) or '').strip()
    if not text or GEMINI_UNSURE_TOKEN in text:
        return None

    return text
