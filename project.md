# SAT Soru Üretim Sistemi — Tam Mimari Dokümantasyonu

## İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Veritabanı Şeması](#veritabanı-şeması)
3. [Soru Tipleri ve Yapıları](#soru-tipleri-ve-yapıları)
4. [PDF Ayrıştırma Katmanı](#pdf-ayrıştırma-katmanı)
5. [AI Analiz Katmanı — Prompt Şablonları](#ai-analiz-katmanı--prompt-şablonları)
6. [Sınav Üretim Motoru](#sınav-üretim-motoru)
7. [Sonuç ve Analiz Sistemi](#sonuç-ve-analiz-sistemi)
8. [Zayıf Alana Göre Soru Üretimi](#zayıf-alana-göre-soru-üretimi)
9. [Klasör Yapısı](#klasör-yapısı)
10. [Teknoloji Stack](#teknoloji-stack)

---

## Genel Bakış

Sistem 3 ana iş akışından oluşur:

```
[12 SAT PDF] → [Ayrıştır + Sınıflandır] → [Veritabanı]
                                                 ↓
                                    [Sınav Üret (2×33 soru)]
                                                 ↓
                                    [Kullanıcı Çözer]
                                                 ↓
                                    [Sonuç + Zayıf Alan Analizi]
                                                 ↓
                                    [Zayıf Alana Özel Sınav Üret]
```

---

## Veritabanı Şeması

### Tablo 1: `question_templates`
Ham PDF'lerden çıkarılan ve analiz edilmiş orijinal sorular. Bunlar üretimin kalıbıdır.

```sql
CREATE TABLE question_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_test         VARCHAR(20) NOT NULL,       -- 'practice_test_4'
    module_number       SMALLINT NOT NULL,           -- 1 veya 2
    question_number     SMALLINT NOT NULL,           -- 1-33
    question_type       VARCHAR(50) NOT NULL,        -- Enum (aşağıda)
    question_subtype    VARCHAR(50),                 -- Ör: 'subject_verb_agreement'
    passage_type        VARCHAR(20) NOT NULL,        -- 'single' | 'dual' | 'notes'
    passage_text        TEXT NOT NULL,               -- Ham passage metni
    question_stem       TEXT NOT NULL,               -- Soru kökü
    option_a            TEXT NOT NULL,
    option_b            TEXT NOT NULL,
    option_c            TEXT NOT NULL,
    option_d            TEXT NOT NULL,
    correct_answer      CHAR(1) NOT NULL,            -- 'A' | 'B' | 'C' | 'D'
    difficulty          VARCHAR(10),                 -- 'easy' | 'medium' | 'hard'
    skill_tag           TEXT,                        -- CollegeBoard beceri etiketi
    distractor_logic    JSONB,                       -- Her yanlış şıkkın neden yanlış olduğu
    key_signals         TEXT[],                      -- Sınıflandırma sinyalleri
    ai_analysis         JSONB,                       -- GPT-4'ün tam analizi
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Enum değerleri (question_type):
-- 'words_in_context'
-- 'main_idea'
-- 'main_purpose'
-- 'text_structure'
-- 'cross_text'
-- 'inference'
-- 'claims_data'
-- 'claims_evidence'
-- 'transitions'
-- 'rhetorical_synthesis'
-- 'grammar_verb_tense'
-- 'grammar_subject_verb'
-- 'grammar_possessive'
-- 'punctuation_dash'
-- 'punctuation_semicolon'
-- 'punctuation_list'
-- 'punctuation_conjunctive'
-- 'form_structure_sense'
```

### Tablo 2: `generated_questions`
AI tarafından üretilen yeni sorular.

```sql
CREATE TABLE generated_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id         UUID REFERENCES question_templates(id),
    question_type       VARCHAR(50) NOT NULL,
    question_subtype    VARCHAR(50),
    passage_type        VARCHAR(20) NOT NULL,
    passage_text        TEXT NOT NULL,
    question_stem       TEXT NOT NULL,
    option_a            TEXT NOT NULL,
    option_b            TEXT NOT NULL,
    option_c            TEXT NOT NULL,
    option_d            TEXT NOT NULL,
    correct_answer      CHAR(1) NOT NULL,
    difficulty          VARCHAR(10) NOT NULL,
    topic               VARCHAR(100),               -- Ör: 'science', 'history', 'literature'
    generation_prompt   TEXT,                       -- Kullanılan prompt (debug için)
    quality_score       SMALLINT,                   -- 1-5 kalite puanı
    is_approved         BOOLEAN DEFAULT false,      -- Manuel onay
    created_at          TIMESTAMPTZ DEFAULT now()
);
```

### Tablo 3: `exams`
Üretilmiş sınavlar.

```sql
CREATE TABLE exams (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id),
    exam_type           VARCHAR(20) DEFAULT 'full',  -- 'full' | 'targeted'
    target_types        TEXT[],                      -- Targeted ise hangi tipler
    status              VARCHAR(20) DEFAULT 'active', -- 'active' | 'completed'
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    time_limit_minutes  SMALLINT DEFAULT 39,
    created_at          TIMESTAMPTZ DEFAULT now()
);
```

### Tablo 4: `exam_questions`
Sınav ile sorular arasındaki köprü tablo. Modül yapısını ve sırayı tutar.

```sql
CREATE TABLE exam_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id             UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_id         UUID REFERENCES generated_questions(id),
    module_number       SMALLINT NOT NULL,           -- 1 veya 2
    position            SMALLINT NOT NULL,           -- 1-33 arası sıra
    UNIQUE(exam_id, module_number, position)
);
```

### Tablo 5: `exam_answers`
Kullanıcının cevapları.

```sql
CREATE TABLE exam_answers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id             UUID REFERENCES exams(id) ON DELETE CASCADE,
    exam_question_id    UUID REFERENCES exam_questions(id),
    user_answer         CHAR(1),                    -- NULL = boş bırakıldı
    is_correct          BOOLEAN,
    time_spent_seconds  SMALLINT,                   -- Soru başına harcanan süre
    answered_at         TIMESTAMPTZ DEFAULT now()
);
```

### Tablo 6: `exam_results`
Sınav bitince hesaplanan özet sonuçlar.

```sql
CREATE TABLE exam_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id             UUID REFERENCES exams(id),
    user_id             UUID REFERENCES users(id),
    total_correct       SMALLINT,
    total_questions     SMALLINT,
    score_lower         SMALLINT,                   -- SAT skalasına dönüştürülmüş (200-800)
    score_upper         SMALLINT,
    module1_correct     SMALLINT,
    module2_correct     SMALLINT,
    type_breakdown      JSONB,                      -- Her tip için doğru/yanlış sayısı
    weak_types          TEXT[],                     -- Zayıf tipler (eşik: %60 altı)
    strong_types        TEXT[],                     -- Güçlü tipler (eşik: %80 üstü)
    recommendations     TEXT[],                     -- AI önerileri
    calculated_at       TIMESTAMPTZ DEFAULT now()
);
```

### Tablo 7: `users`
Kullanıcı bilgileri.

```sql
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100),
    email               VARCHAR(200) UNIQUE,
    created_at          TIMESTAMPTZ DEFAULT now()
);
```

### İndeksler

```sql
-- Sık kullanılan sorgular için
CREATE INDEX idx_qt_type ON question_templates(question_type);
CREATE INDEX idx_gq_type ON generated_questions(question_type, difficulty);
CREATE INDEX idx_gq_approved ON generated_questions(is_approved) WHERE is_approved = true;
CREATE INDEX idx_ea_exam ON exam_answers(exam_id);
CREATE INDEX idx_er_user ON exam_results(user_id);
```

---

## Soru Tipleri ve Yapıları

Her tipin üretim mantığı aşağıda tanımlanmıştır. Bu yapılar AI prompt'larının iskeletidir.

### 1. Words in Context
**Modül içi konum:** Sorular 1–4 (her iki modülde)
**Passage tipi:** Single
**Soru kökü (sabit):** `"Which choice completes the text with the most logical and precise word or phrase?"`

**Yapı mantığı:**
- Passage'da bir kelime çıkarılmış, yerine boşluk var
- 4 şık: 1 doğru + 3 distractor
- Distractor kategorileri:
  - **Kategori A:** Günlük anlamda geçerli ama bağlamda yanlış kelime
  - **Kategori B:** Passage konusuyla ilgili ama cümle yapısına uymayan
  - **Kategori C:** Anlam olarak yakın ama çok genel/belirsiz

**Üretim parametreleri:**
```json
{
  "topic": "science | history | literature | social_science",
  "removed_word_type": "verb | adjective | adverb | noun",
  "difficulty": "easy | medium | hard"
}
```

---

### 2. Main Idea / Main Purpose
**Modül içi konum:** Sorular 5, 10, 12 civarı
**Passage tipi:** Single
**Soru kökü varyantları:**
- `"Which choice best states the main idea of the text?"`
- `"Which choice best states the main purpose of the text?"`

**Yapı mantığı:**
- Passage'ın tek bir ana fikri/amacı var
- Doğru şık: en geniş kapsamlı, hem başı hem sonu kapsayan
- Distractor kategorileri:
  - **Çok dar:** Sadece bir detayı alır
  - **Çok geniş:** Passage'da olmayan bir iddia
  - **Tersine çevrilmiş:** Karakteri/tonu yanlış yansıtan

---

### 3. Text Structure
**Modül içi konum:** Sorular 6–8 civarı
**Passage tipi:** Single
**Soru kökü varyantları:**
- `"Which choice best describes the overall structure of the text?"`
- `"Which choice best describes the function of the [nth] sentence in the overall structure of the text?"`

**Yapı mantığı:**
- Passage'ın 2 hareketi var (sunar → sorgular, tanımlar → örnekler, iddia eder → kanıtlar)
- Doğru şık her iki hareketi de doğru etiketler
- Distractor: hareketi yanlış etiketler veya olmayan bir 3. hareket uydurur

---

### 4. Cross-Text
**Modül içi konum:** Soru 9 civarı
**Passage tipi:** DUAL (Text 1 + Text 2 blokları)
**Soru kökü:** `"Based on the texts, how would [yazar X] most likely respond to [Text 1'deki görüş]?"`

**Yapı mantığı:**
- Text 1: bir görüş/iddia sunar
- Text 2: o görüşe karşı bir perspektif sunar
- Doğru şık: Text 2 yazarının Text 1'e vereceği tutarlı tepki
- Distractor: Text 1 ile çelişmeyen tepkiler, ya da Text 2'nin gerçek pozisyonunu yanlış temsil edenler

---

### 5. Inference
**Modül içi konum:** Soru 11, 18 civarı
**Passage tipi:** Single
**Soru kökü varyantları:**
- `"Based on the text, in what way is X like Y?"`
- `"Which choice most logically completes the text?"` (argüman zinciri bağlamında)

**Yapı mantığı:**
- Passage açıkça söylemez, okuyucunun çıkarım yapması gerekir
- Doğru şık: passage'daki bilgilerden mantıksal olarak türetilebilen
- Distractor: makul görünen ama passage'dan desteklenemeyen

---

### 6. Claims / Data
**Modül içi konum:** Sorular 13, 15, 17 civarı
**Passage tipi:** Single + grafik/tablo
**Soru kökü:** `"Which choice most effectively uses data from the [graph/table] to complete the [text/example]?"`

**Yapı mantığı:**
- Passage bir iddia kurar, boşluğu veri ile tamamlamak gerekir
- Doğru şık: iddiayı destekleyen VE grafik/tablodan doğrulanabilen veri
- Distractor: gerçek veri ama yanlış bağlam, ya da yanlış veri

---

### 7. Claims / Evidence
**Modül içi konum:** Sorular 14, 16 civarı
**Passage tipi:** Single
**Soru kökü varyantları:**
- `"Which finding, if true, would most directly support [araştırmacının] hypothesis?"`
- `"Which finding, if true, would most directly weaken [araştırmacının] hypothesis?"`
- `"Which quotation from [eser] best illustrates the claim?"`

**Yapı mantığı:**
- Passage bir hipotez/iddia kurar
- Doğru şık: hipotezi DOĞRUDAN test eden bulgu (yan konular değil)
- Distractor: konuyla ilgili ama hipotezi doğrudan test etmeyen bulgular

---

### 8. Transitions
**Modül içi konum:** Sorular 27–30 (her iki modülde)
**Passage tipi:** Single
**Soru kökü (sabit):** `"Which choice completes the text with the most logical transition?"`

**Yapı mantığı:**
- İki cümle/paragraf arasındaki mantıksal ilişki:
  - **Zıtlık:** However, In contrast, Nevertheless, Instead
  - **Ekleme:** In addition, Furthermore, Also, Similarly
  - **Sonuç:** Therefore, Thus, Consequently, As a result
  - **Sıralama/Zaman:** Finally, Afterward, Subsequently
  - **Örneklendirme:** For example, Specifically
- Her şık farklı bir ilişki tipini temsil eder

---

### 9. Rhetorical Synthesis
**Modül içi konum:** Sorular 31–33 (her iki modülde)
**Passage tipi:** NOTES (bullet listesi)
**Soru kökü varyantları:**
- `"The student wants to [amaç]. Which choice most effectively uses relevant information from the notes to accomplish this goal?"`

**Amaç kategorileri:**
- `emphasize a difference between X and Y`
- `emphasize a similarity between X and Y`
- `introduce [eser/kişi] to an audience unfamiliar with [bağlam]`
- `present [araştırma] to an audience already familiar with [bağlam]`
- `describe X to an audience unfamiliar with [kişi]`

**Yapı mantığı:**
- 4-5 bullet note verilir
- Doğru şık: amacı tam karşılar + en fazla ilgili bilgiyi taşır
- Distractor:
  - **A tipi:** Amacı kaçırıyor
  - **B tipi:** Eksik bilgi (tek bir bullet'tan)
  - **C tipi:** Yanlış vurgu

---

### 10. Grammar — Verb Tense
**Modül içi konum:** Sorular 19–26 arası
**Soru kökü (sabit):** `"Which choice completes the text so that it conforms to the conventions of Standard English?"`
**Şık yapısı:** Aynı fiilin 4 farklı zaman formu

**Test edilen kurallar:**
- Simple present vs. simple past
- Present perfect vs. simple past  
- Would/could/might + bare infinitive
- Subject-verb agreement (singular/plural)

---

### 11. Grammar — Possessive / Plural
**Şık yapısı:** `word's` / `words'` / `words` / `word's` kombinasyonları

---

### 12. Punctuation
**Şık yapısı:** Aynı kelime, farklı noktalama işareti kombinasyonları

**Alt tipler:**
- `dash`: em-dash kullanımı, parenthetical ifadeler
- `semicolon`: iki bağımsız cümle arasında
- `list`: seri virgül ve noktalı virgül
- `conjunctive`: however/therefore gibi conjunctive adverb'lerin noktalama kuralı

---

### 13. Form / Structure / Sense
**Şık yapısı:** Aynı bilginin farklı cümle yapılarında verilmesi
**Test edilen:** Dangling modifier düzeltme, paralel yapı, gereksiz kelimeler

---

## PDF Ayrıştırma Katmanı

### Algoritma

```python
# pdf_parser.py

import pdfplumber
import re
import json

QUESTION_BLOCK_PATTERN = re.compile(r'^\s*(\d{1,2})\s*$')  # Tek satırda soru numarası

QUESTION_TYPE_SIGNALS = {
    'words_in_context': [
        r'most logical and precise word or phrase',
    ],
    'main_idea': [
        r'best states the main idea',
    ],
    'main_purpose': [
        r'best states the main purpose',
    ],
    'text_structure': [
        r'best describes the overall structure',
        r'function of the .*(sentence|paragraph)',
    ],
    'cross_text': [
        r'Based on the texts',
        r'how would .* respond',
    ],
    'inference': [
        r'in what way is .* like',
        r'Based on the text,',
    ],
    'claims_data': [
        r'most effectively uses data from the (graph|table)',
    ],
    'claims_evidence': [
        r'most directly support',
        r'most directly weaken',
        r'most strongly support',
        r'best illustrates the (claim|journalist)',
    ],
    'transitions': [
        r'most logical transition',
    ],
    'rhetorical_synthesis': [
        r'most effectively uses relevant information from the notes',
    ],
    'grammar': [
        r'conforms to the conventions of Standard English',
    ],
}

PASSAGE_TYPE_SIGNALS = {
    'dual': r'^Text [12]',
    'notes': r'^\s*•',  # Bullet noktası
    'single': None,     # Varsayılan
}

def detect_passage_type(passage_text: str) -> str:
    if re.search(PASSAGE_TYPE_SIGNALS['dual'], passage_text, re.MULTILINE):
        return 'dual'
    if re.search(PASSAGE_TYPE_SIGNALS['notes'], passage_text, re.MULTILINE):
        return 'notes'
    return 'single'

def classify_question_type(question_stem: str, options: list[str]) -> str:
    for qtype, patterns in QUESTION_TYPE_SIGNALS.items():
        for pattern in patterns:
            if re.search(pattern, question_stem, re.IGNORECASE):
                if qtype == 'grammar':
                    return classify_grammar_subtype(options)
                return qtype
    return 'unknown'

def classify_grammar_subtype(options: list[str]) -> str:
    # Şıklara bakarak alt tip belirle
    all_opts = ' '.join(options).lower()
    
    # Noktalama: aynı kelime farklı noktalama
    punct_chars = sum(1 for o in options if any(p in o for p in [';', '—', ',']))
    if punct_chars >= 3:
        if '—' in all_opts or 'dash' in all_opts:
            return 'punctuation_dash'
        if ';' in all_opts:
            return 'punctuation_semicolon'
        return 'punctuation_list'
    
    # İyelik
    if "'s" in all_opts or "s'" in all_opts:
        return 'grammar_possessive'
    
    # Fiil zamanı: had/would/survives gibi formlar
    verb_forms = ['had ', 'would ', 'will ', 'survives', 'survived', 'was ', 'were ', 'is ', 'are ']
    if sum(1 for v in verb_forms if v in all_opts) >= 2:
        return 'grammar_verb_tense'
    
    # Subject-verb: is/are/was/were
    sv_forms = ['are', 'is', 'was', 'were', 'have been']
    if sum(1 for s in sv_forms if s in all_opts) >= 2:
        return 'grammar_subject_verb'
    
    return 'form_structure_sense'
```

---

## AI Analiz Katmanı — Prompt Şablonları

### Prompt 1: Soru Analizi (Şablon Çıkarımı)

Her orijinal soru için bu prompt ile analiz yapılır ve `question_templates.ai_analysis` alanına kaydedilir. OpenAI API (GPT-4) kullanılır.

```python
ANALYSIS_PROMPT = """
Sen bir SAT uzmanısın. Aşağıdaki SAT Reading & Writing sorusunu analiz et.

PASSAGE:
{passage}

SORU:
{question_stem}

ŞIKLAR:
A) {option_a}
B) {option_b}
C) {option_c}
D) {option_d}

DOĞRU CEVAP: {correct_answer}

Yalnızca aşağıdaki JSON formatında cevap ver, başka hiçbir şey yazma:

{{
  "question_type": "{question_type}",
  "question_subtype": "<varsa alt tip, yoksa null>",
  "difficulty": "easy | medium | hard",
  "skill_tag": "<CollegeBoard beceri etiketi>",
  "passage_topic": "<bilim | tarih | edebiyat | sosyal bilim | sanat>",
  "passage_structure": "<passage'ın yapısı, 1 cümle>",
  "what_is_tested": "<bu sorunun tam olarak ne test ettiği, 1-2 cümle>",
  "correct_answer_reasoning": "<neden bu şık doğru, 1-2 cümle>",
  "distractor_logic": {{
    "A": "<neden yanlış>",
    "B": "<neden yanlış>",
    "C": "<neden yanlış>",
    "D": "<neden yanlış>"
  }},
  "key_signals": ["<bu tipi tanımlamayı sağlayan 2-3 anahtar sinyal>"],
  "generation_template": {{
    "passage_instructions": "<yeni passage nasıl yazılmalı>",
    "question_stem_pattern": "<soru kökünün değişmez kısmı>",
    "correct_answer_pattern": "<doğru cevap nasıl kurulmalı>",
    "distractor_patterns": ["<distractor 1 nasıl kurulmalı>", "...", "..."]
  }}
}}
"""
```

---

### Prompt 2: Sınav Üretimi — Tek Soru

```python
GENERATION_PROMPT = """
Sen bir SAT soru yazarısın. Aşağıdaki şablona göre YENİ bir SAT Reading & Writing sorusu üret.

SORU TİPİ: {question_type}
ZORLUK: {difficulty}
KONU: {topic}
PASSAGE TİPİ: {passage_type}

ŞU ANDA ÜRETİLMEKTE OLAN SINAV KONULARI (tekrar etme): {used_topics}

REFERANS ŞABLON (bu soruyu taklit et ama kopyalama):
{template_example}

ÜRETİM KURALLARI:
1. Passage orijinal ve SAT üslubuyla yazılmış olmalı (akademik, bilgilendirici)
2. Soru kökü SAT'ın standart kalıplarına uymalı
3. 4 şık üret: 1 açık doğru cevap + 3 eğitici distractor
4. Her distractor belirli bir hata tipini temsil etmeli (şablondaki distractor_patterns'ı kullan)
5. Passage uzunluğu: 50-150 kelime arası (single), 80-200 kelime (dual), 4-6 bullet (notes)
6. Dil: İngilizce

Yalnızca aşağıdaki JSON formatında cevap ver:

{{
  "passage": "<passage metni>",
  "question_stem": "<soru kökü>",
  "option_a": "<şık A>",
  "option_b": "<şık B>",
  "option_c": "<şık C>",
  "option_d": "<şık D>",
  "correct_answer": "A | B | C | D",
  "topic": "<passage konusu>",
  "difficulty": "{difficulty}",
  "correct_answer_explanation": "<neden bu cevap doğru, Türkçe, 1-2 cümle>"
}}
"""
```

---

### Prompt 3: Zayıf Alan Analizi

```python
WEAKNESS_ANALYSIS_PROMPT = """
Aşağıdaki SAT sonuç verilerini analiz et ve öğrenciye kişisel öneriler ver.

ÖĞRENCİ SONUÇLARI:
{type_breakdown_json}

Her tipe göre doğru/toplam oranları:
{performance_summary}

Yalnızca JSON formatında cevap ver:

{{
  "weak_types": ["<zayıf tip 1>", "<zayıf tip 2>"],
  "strong_types": ["<güçlü tip 1>", "<güçlü tip 2>"],
  "priority_order": ["<önce çalışılması gereken tip>", "..."],
  "recommendations": [
    "<öneri 1 — Türkçe, 1-2 cümle>",
    "<öneri 2>",
    "<öneri 3>"
  ],
  "study_tips": {{
    "<zayıf tip 1>": "<bu tip için çalışma ipucu>",
    "<zayıf tip 2>": "<bu tip için çalışma ipucu>"
  }}
}}

Zayıf tip eşiği: %60 altı doğruluk oranı
Güçlü tip eşiği: %80 üstü doğruluk oranı
"""
```

---

## Sınav Üretim Motoru

### Modül Başına Soru Dağılımı (SAT Standardı)

Her modülde 33 soru, her iki modülde aynı tip dağılımı:

```python
MODULE_QUESTION_DISTRIBUTION = [
    # (soru_tipi, adet, konum_aralığı)
    ('words_in_context',      4,  range(1, 5)),    # 1-4
    ('main_purpose',          1,  range(5, 6)),    # 5
    ('text_structure',        2,  range(6, 8)),    # 6-7
    ('text_structure',        1,  range(8, 9)),    # 8 (sentence function)
    ('cross_text',            1,  range(9, 10)),   # 9
    ('main_idea',             2,  range(10, 13)),  # 10, 12
    ('inference',             1,  range(11, 12)),  # 11
    ('claims_data',           2,  range(13, 18)),  # 13, 15 veya 17
    ('claims_evidence',       2,  range(14, 17)),  # 14, 16
    ('inference',             1,  range(18, 19)),  # 18
    ('grammar_possessive',    1,  range(19, 20)),  # 19
    ('grammar_verb_tense',    1,  range(20, 21)),  # 20
    ('punctuation_dash',      1,  range(21, 22)),  # 21
    ('grammar_subject_verb',  1,  range(22, 23)),  # 22
    ('punctuation_semicolon', 1,  range(23, 24)),  # 23
    ('form_structure_sense',  1,  range(24, 25)),  # 24
    ('punctuation_list',      1,  range(25, 26)),  # 25
    ('punctuation_conjunctive',1, range(26, 27)),  # 26
    ('transitions',           4,  range(27, 31)),  # 27-30
    ('rhetorical_synthesis',  3,  range(31, 34)),  # 31-33
]
# TOPLAM: 33 soru ✓
```

### Sınav Üretim Fonksiyonu

```python
async def generate_exam(
    user_id: str,
    exam_type: str = 'full',           # 'full' | 'targeted'
    target_types: list[str] = None,    # Targeted için hedef tipler
    difficulty: str = 'mixed'          # 'easy' | 'medium' | 'hard' | 'mixed'
) -> dict:
    
    exam_id = create_exam_record(user_id, exam_type, target_types)
    
    modules = []
    used_topics = []
    
    for module_num in [1, 2]:
        module_questions = []
        
        for (q_type, count, positions) in MODULE_QUESTION_DISTRIBUTION:
            
            # Targeted sınavda: sadece hedef tipleri üret,
            # diğer pozisyonlara onaylı generated_questions'dan al
            if exam_type == 'targeted' and q_type not in target_types:
                questions = fetch_approved_questions(
                    q_type, count, exclude_topics=used_topics
                )
            else:
                # AI ile üret
                template = get_best_template(q_type)
                questions = await generate_questions_batch(
                    template=template,
                    count=count,
                    difficulty=resolve_difficulty(difficulty, positions),
                    used_topics=used_topics
                )
            
            module_questions.extend(questions)
            used_topics.extend([q['topic'] for q in questions])
        
        # 33 soruyu pozisyon sırasına göre kaydet
        save_module_questions(exam_id, module_num, module_questions)
        modules.append(module_questions)
    
    return {
        'exam_id': exam_id,
        'module_1': modules[0],
        'module_2': modules[1]
    }

def resolve_difficulty(setting: str, positions: range) -> str:
    """Sınav içi zorluk dağılımı: başta kolay, sonda zor"""
    if setting != 'mixed':
        return setting
    avg_pos = sum(positions) / len(positions)
    if avg_pos <= 11:
        return 'easy'
    elif avg_pos <= 22:
        return 'medium'
    else:
        return 'hard'
```

---

## Sonuç ve Analiz Sistemi

### Sınav Tamamlandığında Çalışan Fonksiyon

```python
def calculate_exam_results(exam_id: str) -> dict:
    
    # 1. Cevapları çek ve karşılaştır
    answers = fetch_exam_answers(exam_id)
    questions = fetch_exam_questions(exam_id)
    
    # 2. Tip bazlı breakdown hesapla
    type_breakdown = {}
    for q, a in zip(questions, answers):
        qtype = q['question_type']
        if qtype not in type_breakdown:
            type_breakdown[qtype] = {'correct': 0, 'total': 0}
        type_breakdown[qtype]['total'] += 1
        if a['is_correct']:
            type_breakdown[qtype]['correct'] += 1
    
    # 3. Oran hesapla
    for qtype in type_breakdown:
        d = type_breakdown[qtype]
        d['accuracy'] = round(d['correct'] / d['total'], 2) if d['total'] > 0 else 0
    
    # 4. Zayıf ve güçlü alanları belirle
    weak_types  = [t for t, d in type_breakdown.items() if d['accuracy'] < 0.60]
    strong_types = [t for t, d in type_breakdown.items() if d['accuracy'] >= 0.80]
    
    # 5. SAT skoru hesapla (raw → scaled dönüşüm tablosundan)
    total_correct = sum(a['is_correct'] for a in answers)
    score_lower, score_upper = raw_to_scaled_score(total_correct)
    
    # 6. AI önerileri üret
    recommendations = fetch_ai_recommendations(type_breakdown)
    
    # 7. Kaydet
    result = {
        'exam_id': exam_id,
        'total_correct': total_correct,
        'total_questions': len(answers),
        'score_lower': score_lower,
        'score_upper': score_upper,
        'type_breakdown': type_breakdown,
        'weak_types': weak_types,
        'strong_types': strong_types,
        'recommendations': recommendations
    }
    save_exam_results(result)
    return result

# SAT Ham Puan → Ölçekli Puan Dönüşüm Tablosu
RAW_TO_SCALED = {
    0: (200, 200), 7: (200, 210), 8: (200, 220),
    9: (210, 230), 10: (230, 250), 11: (240, 260),
    # ... (tam tablo scoring PDF'inden)
    64: (750, 770), 65: (770, 790), 66: (790, 800)
}
```

### Sonuç Ekranında Gösterilecekler

```
┌─────────────────────────────────────────────┐
│  SAT Reading & Writing Skor Tahmini         │
│  520 – 540  (200–800 skalasında)            │
├─────────────────────────────────────────────┤
│  Toplam Doğru: 39 / 66                      │
│  Modül 1: 21/33   Modül 2: 18/33            │
├─────────────────────────────────────────────┤
│  TİP BAZLI ANALİZ                           │
│                                             │
│  ✅ Güçlü Alanlar:                          │
│     Transitions          5/5  (100%)        │
│     Grammar              4/5  ( 80%)        │
│                                             │
│  ❌ Zayıf Alanlar:                          │
│     Cross-text           0/2  (  0%)        │
│     Claims & Evidence    2/4  ( 50%)        │
│     Text Structure       1/3  ( 33%)        │
├─────────────────────────────────────────────┤
│  ÖNERİLER                                   │
│  • Cross-text: İki passage arasındaki       │
│    ilişkiyi kurarken her yazarın pozisyonunu│
│    ayrı ayrı not al.                        │
│  • Claims & Evidence: Hipotezi DOĞRUDAN     │
│    test eden bulguyu ara, konu ilgisi        │
│    yeterli değil.                           │
├─────────────────────────────────────────────┤
│  [Zayıf Alanlara Odaklı Yeni Sınav Başlat] │
└─────────────────────────────────────────────┘
```

---

## Zayıf Alana Göre Soru Üretimi

### Targeted Sınav Mantığı

Kullanıcı "Zayıf alanlara odaklı sınav başlat" dediğinde:

```python
async def generate_targeted_exam(user_id: str, last_exam_result: dict) -> dict:
    
    weak_types = last_exam_result['weak_types']
    
    # Targeted sınavda modül yapısı AYNI kalır (33 soru, aynı pozisyonlar)
    # ama zayıf tip pozisyonlarına daha fazla o tipten soru yerleştirilir
    
    # Strateji:
    # - Zayıf tipler: normalden 1.5x daha fazla o tipten soru
    # - Fazla sorular "neutral" pozisyonlara yerleştirilir
    # - Yapı bozulmaz, çünkü gerçek SAT'ta da tip dağılımı değişebilir
    
    targeted_distribution = adjust_distribution_for_weak_types(
        base_distribution=MODULE_QUESTION_DISTRIBUTION,
        weak_types=weak_types
    )
    
    return await generate_exam(
        user_id=user_id,
        exam_type='targeted',
        target_types=weak_types,
        distribution_override=targeted_distribution
    )
```

### Hangi Soruları Takip Ediyoruz?

`exam_answers` tablosunda her cevap `question_type` ile birlikte saklandığı için:

```sql
-- Kullanıcının belirli bir tipteki tüm tarihsel performansı
SELECT 
    gq.question_type,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN ea.is_correct THEN 1 ELSE 0 END) as correct,
    ROUND(AVG(CASE WHEN ea.is_correct THEN 1.0 ELSE 0.0 END) * 100, 1) as accuracy_pct
FROM exam_answers ea
JOIN exam_questions eq ON ea.exam_question_id = eq.id
JOIN generated_questions gq ON eq.question_id = gq.id
WHERE eq.exam_id IN (
    SELECT id FROM exams WHERE user_id = $1
)
GROUP BY gq.question_type
ORDER BY accuracy_pct ASC;
```

Bu sorgu kullanıcının uzun vadeli zayıf alanlarını gösterir ve targeted sınavlar için kullanılır.

---

## Klasör Yapısı

```
sat_system/
├── README.md
├── sat_system_architecture.md     ← Bu dosya
│
├── ingestion/                     ← PDF okuma ve DB'ye kaydetme
│   ├── pdf_parser.py
│   ├── question_classifier.py
│   └── run_ingestion.py           ← 12 PDF'i işleyen ana script
│
├── ai/                            ← Claude API entegrasyonu
│   ├── analyzer.py                ← Orijinal soruları analiz eder
│   ├── generator.py               ← Yeni sorular üretir
│   ├── weakness_analyzer.py       ← Sonuçları analiz eder
│   └── prompts.py                 ← Tüm prompt şablonları
│
├── exam/                          ← Sınav motoru
│   ├── exam_builder.py            ← Sınav oluşturur
│   ├── exam_scorer.py             ← Sınav puanlar
│   └── targeted_exam.py          ← Zayıf alana göre sınav
│
├── db/                            ← Veritabanı katmanı
│   ├── schema.sql                 ← Tüm CREATE TABLE ifadeleri
│   ├── migrations/
│   └── queries.py                 ← Sık kullanılan sorgular
│
├── api/                           ← REST API (FastAPI)
│   ├── main.py
│   ├── routers/
│   │   ├── exams.py
│   │   ├── results.py
│   │   └── users.py
│   └── schemas.py                 ← Pydantic modeller
│
└── frontend/                      ← Kullanıcı arayüzü (opsiyonel)
    ├── exam_view/
    └── results_view/
```

---

## Teknoloji Stack

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| PDF Okuma | `pdfplumber` | Layout-aware, tablo/grafik tespiti |
| Veritabanı | PostgreSQL | JSONB desteği, güçlü sorgular |
| ORM | SQLAlchemy veya raw psycopg2 | Tercih |
| AI API | Anthropic Claude API (`claude-sonnet-4-6`) | Soru analizi ve üretimi |
| Backend | FastAPI (Python) | Async, hızlı |
| Çevre Değişkenleri | `.env` + `python-dotenv` | API key yönetimi |

### Gerekli Environment Değişkenleri

```bash
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://user:pass@localhost:5432/sat_db
MAX_TOKENS=1000
CLAUDE_MODEL=claude-sonnet-4-6
QUESTION_QUALITY_THRESHOLD=3   # 1-5 skalasında minimum kalite skoru
```

---

## Önemli Notlar

### Distractor Kalitesi Kritiktir
Zayıf distractor'lar soruyu trivial yapar. Her distractor belirli bir hata kategorisini temsil etmeli. AI prompt'unda `distractor_patterns` alanı bu yüzden kritik.

### Konu Çeşitliliği
Aynı sınavda konu tekrarı olmamalı. `used_topics` listesi her soru üretiminde güncellenir.

### Onay Mekanizması
`generated_questions.is_approved = false` varsayılanı. Üretilen sorular manuel gözden geçirilip onaylanmadan sınavlarda kullanılmamalı (ya da kalite skoru eşiği uygulanmalı).

### SAT Üslubu
Passage'lar akademik ve bilgilendirici olmalı. Kurgusal metinler için "The following text is adapted from..." formatı kullanılmalı. Bu, gerçek SAT üslubuyla birebir örtüşür.