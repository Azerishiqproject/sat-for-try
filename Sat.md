# SAT Reading & Writing — Soru Matematiği (AI Üretim Referansı)

Bu döküman, bir AI'ın gerçek SAT'a birebir benzer sınav üretebilmesi için gereken tüm yapısal kuralları içerir. Her kural College Board'un orijinal practice testlerinden tersine mühendislikle çıkarılmıştır.

---

## GENEL YAPI

- **Toplam soru:** 66 (2 modül × 33 soru)
- **Toplam süre:** 78 dakika (modül başına 39 dakika)
- **Soru formatı:** Tüm sorular 4 şıklı çoktan seçmeli (A/B/C/D)
- **Her soru:** 1 passage (veya not listesi) + 1 soru kökü + 4 şık
- **Modül 1 ve Modül 2:** Tip dağılımı ve sıra AYNIDIR — sadece içerik ve zorluk farklılaşır
- **Modül 2 zorluğu:** Modül 1 performansına göre belirlenir (adaptif), ama format değişmez

---

## MODÜL YAPISI — 33 SORUNUN SIRASI VE TİP DAĞILIMI

Aşağıdaki sıra her iki modülde de AYNEN uygulanır. Soru numaraları pozisyonu gösterir, tipler sabit kalır.

```
POZİSYON  │ TİP                    │ ADET │ PASSAGE TİPİ
──────────┼────────────────────────┼──────┼─────────────
1         │ Words in Context       │  1   │ Single
2         │ Words in Context       │  1   │ Single
3         │ Words in Context       │  1   │ Single
4         │ Words in Context       │  1   │ Single
──────────┼────────────────────────┼──────┼─────────────
5         │ Main Purpose           │  1   │ Single
6         │ Text Structure         │  1   │ Single
7         │ Text Structure         │  1   │ Single
8         │ Text Structure         │  1   │ Single
──────────┼────────────────────────┼──────┼─────────────
9         │ Cross-Text             │  1   │ Dual (Text 1 + Text 2)
──────────┼────────────────────────┼──────┼─────────────
10        │ Main Idea              │  1   │ Single
11        │ Inference              │  1   │ Single
12        │ Main Idea              │  1   │ Single
──────────┼────────────────────────┼──────┼─────────────
13        │ Claims — Data          │  1   │ Single + grafik/tablo
14        │ Claims — Evidence      │  1   │ Single
15        │ Claims — Data          │  1   │ Single + grafik/tablo
16        │ Claims — Evidence      │  1   │ Single
17        │ Claims — Data          │  1   │ Single + tablo
18        │ Inference / Logic      │  1   │ Single
──────────┼────────────────────────┼──────┼─────────────
19        │ Grammar — Possessive   │  1   │ Single
20        │ Grammar — Verb Tense   │  1   │ Single
21        │ Punctuation — Dash     │  1   │ Single
22        │ Grammar — Subject-Verb │  1   │ Single
23        │ Punctuation — Semicolon│  1   │ Single
24        │ Form/Structure/Sense   │  1   │ Single
25        │ Punctuation — List     │  1   │ Single
26        │ Punctuation — Conjunct.│  1   │ Single
──────────┼────────────────────────┼──────┼─────────────
27        │ Transitions            │  1   │ Single
28        │ Transitions            │  1   │ Single
29        │ Transitions            │  1   │ Single
30        │ Transitions            │  1   │ Single
──────────┼────────────────────────┼──────┼─────────────
31        │ Rhetorical Synthesis   │  1   │ Notes (bullet list)
32        │ Rhetorical Synthesis   │  1   │ Notes (bullet list)
33        │ Rhetorical Synthesis   │  1   │ Notes (bullet list)
──────────┴────────────────────────┴──────┴─────────────
TOPLAM: 33 soru
```

**Not:** Pozisyon 5–8 arası "Reading" grubunun 2. dalgası olabilir. Bazen pos. 8 "sentence function" sorusu olur. Genel eğilim bu sıradır ama ±1 pozisyon kayması olabilir.

---

## TİP BAZLI DETAYLI MATEMATİK

---

### TİP 1 — WORDS IN CONTEXT
**Pozisyon:** 1, 2, 3, 4
**Adet (modül başına):** 4
**Passage tipi:** Single (tek metin bloğu)
**Passage uzunluğu:** 40–80 kelime

#### Soru Kökü (DEĞİŞMEZ):
```
"Which choice completes the text with the most logical and precise word or phrase?"
```

#### Passage Yapısı:
- Bir cümlede ya da iki cümlede bir kelime eksik, yerine boşluk `_______` var
- Boşluk genellikle fiil pozisyonunda
- Bağlam, hangi kelimenin gireceğini mantıksal olarak ZORLA belirler
- Boşluk öncesi ve sonrası cümlede ipuçları gömülüdür

#### Şık Yapısı:
```
A) [Kategori A distractor — günlük anlamda doğru ama bağlamda yanlış]
B) [DOĞRU — hem anlam hem bağlam hem ton uyuyor]
C) [Kategori B distractor — konuyla ilgili ama cümle yapısına uymuyor]
D) [Kategori C distractor — çok genel/belirsiz, nüansı yakalamıyor]
```

#### 3 Distractor Kategorisi:
1. **Semantik yakın ama yanlış:** Kelime anlamı çağrıştırıcı ama bağlamda yanlış (örn: "gathered" yerine "collected" doğruyken "attached" yanlış)
2. **Konu ilgili ama cümle dışı:** Passage'ın genel konusuyla ilgili ama o cümleye grammatical veya semantik olarak oturmuyor
3. **Çok geniş/belirsiz:** Genel bir kelime, bağlamdaki spesifik nüansı karşılamıyor

#### Değerlendirme Kriteri:
- Doğru cevap: bağlam tarafından ZORUNLU kılınan tek kelimedir
- Eğer iki şık "mantıklı" geliyorsa soru hatalı demektir — iyi WIC sorusunda yalnızca 1 şık kesinlikle oturur
- Passage'ı okumadan şıklara bakınca karar verilemez olmalı

#### Zorluk Skalası:
- **Easy (pos. 1-2):** Kelimeler günlük dil, bağlam çok açık
- **Medium (pos. 3):** Kelimeler akademik, bağlam 2 cümle gerektirir
- **Hard (pos. 4):** Kelimeler sofistike, bağlamda zıt bir yapı var ("not X but Y")

---

### TİP 2 — MAIN PURPOSE
**Pozisyon:** 5
**Adet (modül başına):** 1
**Passage tipi:** Single — genellikle edebi metin (roman, hikaye, şiir)
**Passage uzunluğu:** 80–150 kelime

#### Soru Kökü (DEĞİŞMEZ):
```
"Which choice best states the main purpose of the text?"
```

#### Passage Yapısı:
- Edebi metin (roman/hikaye excerpt) ya da bilgilendirici metin
- Tek bir belirgin amaç taşır (bir karakterin duygusunu göstermek, bir durumu betimlemek vb.)
- Passage içinde zıt unsurlar sıkça bulunur (hem sevmek hem de şikayet etmek gibi)

#### Şık Yapısı:
```
A) To [doğru amaç — passage'ın tamamını kapsayan]
B) To [çok dar — sadece bir detayı alıyor]
C) To [passage'da olmayan bir amaç — uydurulmuş]
D) To [amaç doğru ama ton yanlış — karakteri yanlış yansıtıyor]
```

Her şık "To [fiil] [nesne]" formatında başlar.

#### Değerlendirme Kriteri:
- Doğru şık passage'ın TAMAMINI kapsar, sadece bir bölümünü değil
- Yanlış şıklar: ya çok dar (tek detay), ya çok geniş (passage'da yok), ya da tonu ters çevirmiş
- Karakter "şikayet ediyor ama aslında gurur duyuyor" gibi çelişkili durumlarda yanlış şık tek yüzü alır

---

### TİP 3 — TEXT STRUCTURE
**Pozisyon:** 6, 7, 8
**Adet (modül başına):** 3
**Passage tipi:** Single
**Passage uzunluğu:** 80–150 kelime

#### Soru Kökü Varyantları:
```
Pozisyon 6-7: "Which choice best describes the overall structure of the text?"
Pozisyon 8:   "Which choice best describes the function of the [nth] sentence 
               in the overall structure of the text?"
```

#### Passage Yapısı — 2 Hareket Kuralı:
Her passage iki hareketten oluşur:
- **Hareket 1:** Bir şey sunar / tanımlar / iddia eder / betimler
- **Hareket 2:** Onu sorgular / genişletir / kontrast kurar / örnekler / tamamlar

Örnek çiftler:
- "eleştiriyi kabul eder → kendi büyük hedefini açıklar"
- "doğal bir olayı betimler → o olayın anlamını sorgular"
- "genel bir genelleme sunar → spesifik örnekle kanıtlar"
- "bir varsayımı aktarır → yeni araştırmayla çürütür"

#### Şık Yapısı (Overall Structure):
```
A) The [özne] [Hareket 1 yanlış], then [Hareket 2 yanlış]
B) The [özne] [Hareket 1 DOĞRU], then [Hareket 2 DOĞRU]   ← DOĞRU
C) The [özne] [Hareket 1 doğru ama Hareket 2 yanlış]
D) The [özne] [olmayan bir 3. hareket]
```

Her şık iki eylemden oluşan bir cümle: "[özne] X yapar, sonra Y yapar."

#### Şık Yapısı (Sentence Function):
```
A) It states the hypothesis that [yanlış içerik]
B) It presents a generalization that is exemplified by [DOĞRU]   ← DOĞRU
C) It offers an alternative explanation for [yanlış]
D) It provides context that clarifies [alakasız]
```

Sentence function şıkları şu kalıplardan biri:
- "It states..." / "It presents..." / "It introduces..." / "It offers..." / "It provides..."

#### Değerlendirme Kriteri:
- Her iki hareketi de doğru etiketleyen tek şık kazanır
- Distractor'lar genellikle bir hareketi doğru, diğerini yanlış etiketler
- "Olmayan hareket" distractor'ı: passage'da hiç geçmeyen bir eylem eklenir

---

### TİP 4 — CROSS-TEXT
**Pozisyon:** 9
**Adet (modül başına):** 1
**Passage tipi:** DUAL — "Text 1" ve "Text 2" olarak işaretlenmiş iki ayrı blok

#### Soru Kökü (DEĞİŞMEZ):
```
"Based on the texts, how would [Text 2'deki yazar/araştırmacı] (Text 2) 
most likely respond to the [görüş/iddia] presented in Text 1?"
```

#### Passage Yapısı:
- **Text 1:** Bir görüş, teori veya "conventional wisdom" sunar
- **Text 2:** O görüşe karşı çıkan, onu güncelleyen veya daha karmaşık bir perspektif sunar
- İki text aynı KONUDA ama farklı POZISYONDA

#### Şık Yapısı:
```
A) By [Text 2'nin pozisyonuyla uyuşmayan tepki — çok uzlaşmacı]
B) By [DOĞRU — Text 2'nin gerçek argümanı, Text 1'e doğrudan yanıt]
C) By [Text 1'le aslında çelişmeyen bir tepki]
D) By [Text 2'de hiç geçmeyen bir tepki — uydurulmuş]
```

Her şık "By [gerund]..." formatında başlar.

#### Değerlendirme Kriteri:
- Doğru şık: Text 2'nin ana argümanını Text 1'deki spesifik iddiaya karşı konumlandırır
- Yanlış şıklar: ya Text 2'yi yanlış okur, ya Text 1'e yanıt vermez, ya da ikisini uzlaştırır (halbuki çelişiyorlar)
- Bu soru tipi en yüksek hata oranına sahip çünkü iki metni aynı anda yönetmek gerekir

---

### TİP 5 — MAIN IDEA
**Pozisyon:** 10, 12
**Adet (modül başına):** 2
**Passage tipi:** Single — genellikle edebi metin (roman excerpt)
**Passage uzunluğu:** 80–120 kelime

#### Soru Kökü (DEĞİŞMEZ):
```
"Which choice best states the main idea of the text?"
```

#### Passage Yapısı:
- Çoğunlukla bir karakter veya durum betimlemesi
- Passage'ın merkezi tek bir fikir etrafında döner
- Detaylar merkezi fikri destekler ama merkezi fikrin kendisi değildir

#### Şık Yapısı:
```
A) [Yanlış içerik — passage'da hiç olmayan]
B) [Çok dar — sadece bir detay]
C) [Yanlış ton — karakteri/durumu ters çeviriyor]
D) [DOĞRU — passage'ın tamamını kapsayan, doğru ton]
```

#### Değerlendirme Kriteri:
- Doğru şık tüm cümleleri bir araya bağlayan "şemsiye fikri" ifade eder
- Main Idea ile Main Purpose farkı: Main Idea "ne söylüyor?" sorusuna yanıt verirken, Main Purpose "neden yazıldı?" sorusuna yanıt verir

---

### TİP 6 — INFERENCE
**Pozisyon:** 11, 18
**Adet (modül başına):** 2
**Passage tipi:** Single
**Passage uzunluğu:** 80–150 kelime

#### Soru Kökü Varyantları:
```
Pozisyon 11: "Based on the text, in what way is X like Y?"
             "Based on the text, what can be inferred about X?"
Pozisyon 18: "Which choice most logically completes the text?"
             (argüman zincirinin mantıksal sonucu)
```

#### Pozisyon 11 — Analogy/Comparison Inference:
Passage bir benzetme veya karşılaştırma içerir. Soru o karşılaştırmanın hangi boyutunu test ettiğini sorar.

```
A) [Benzetmenin yanlış boyutu — passage'da yok]
B) [Çok genel — iki şey hakkında her zaman doğru olabilir]
C) [DOĞRU — passage'ın spesifik dil ve mantığından türetilen]
D) [Akla yatkın ama passage tarafından desteklenmeyen]
```

#### Pozisyon 18 — Logical Completion:
Passage bir argüman kurar, son cümle eksik. Doğru şık argümanın zorunlu sonucudur.

```
A) [Argümanla çelişen sonuç]
B) [Argümanla ilgisi olmayan sonuç]
C) [Akla yatkın ama argümandan türetilemeyen]
D) [DOĞRU — argümanın tek mantıksal devamı]
```

#### Değerlendirme Kriteri:
- Doğru şık passage'daki spesifik bilgiden çıkarılabilir, genel bilgiden değil
- "Akla yatkın ama passage'da yok" en yaygın distractor tipidir

---

### TİP 7 — CLAIMS: DATA
**Pozisyon:** 13, 15, 17
**Adet (modül başına):** 3
**Passage tipi:** Single + grafik veya tablo (ZORUNLU)
**Passage uzunluğu:** 80–150 kelime

#### Soru Kökü Varyantları:
```
"Which choice most effectively uses data from the graph to complete the text?"
"Which choice most effectively uses data from the table to complete the [text/example/statement]?"
```

#### Passage Yapısı:
- Grafik veya tablo passage'ın üstünde ya da solunda
- Passage veriyi açıklar ve sonunda boşluk `_______` ile biter
- Boşluk, grafikten/tablodan bir veri noktasıyla doldurulmalı

#### Grafik/Tablo Türleri:
- Bar grafik (en yaygın)
- Çizgi grafik
- Veri tablosu (2-4 sütun)
- Scatter plot

#### Şık Yapısı:
```
A) [Grafikten doğrulanabilen ama passage'ın iddiasını DESTEKLEMEYEN veri]
B) [Grafikten yanlış okunan veri]
C) [DOĞRU — passage iddiasını destekleyen VE grafikten doğrulanabilen veri]
D) [Grafikten doğru ama pozisyon 15'te: SPC yerine OCC, yani yanlış karşılaştırma]
```

#### Değerlendirme Kriteri:
- İKİ koşul aynı anda sağlanmalı: (1) grafik/tablodan doğrulanabilir + (2) passage iddiasını destekler
- Yaygın tuzak: Grafikten doğrulanabilen ama iddiayı desteklemeyen veri seçmek
- Özellikle pos. 17'de "sürpriz bulgu" formatı var: passage beklenmedik bir sonuca atıfta bulunur, doğru şık o beklenmedik veriyi verir

---

### TİP 8 — CLAIMS: EVIDENCE
**Pozisyon:** 14, 16
**Adet (modül başına):** 2
**Passage tipi:** Single (grafik YOK)
**Passage uzunluğu:** 100–180 kelime

#### Soru Kökü Varyantları:
```
Pozisyon 14: "Which finding, if true, would most directly support [araştırmacının] hypothesis?"
             "Which finding, if true, would most directly weaken [araştırmacının] hypothesis?"
Pozisyon 16: "Which quotation from [eser] best illustrates the [claim/journalist's claim]?"
```

#### Support/Weaken Formatı (Pos. 14):
Passage bir araştırmacının hipotezini açıklar.

```
A) [Hipotezle konuyla ilgili ama DOĞRUDAN test etmiyor]
B) [Hipotezi çürüten bulgu — "weaken" sorusuysa DOĞRU]
C) [DOĞRU support için: hipotezi doğrudan test eden ve destekleyen bulgu]
D) [Hipotezle alakasız, sadece genel ilgili konu]
```

**Kritik Kural:** "Most directly support/weaken" ifadesi ÇOK ÖNEMLİ. Sadece konuyla ilgili değil, hipotezi DOĞRUDAN test eden bulgu gerekir.

#### Quotation Formatı (Pos. 16):
Passage bir iddiada bulunur (örn: "X'in Y hakkında Z duygusu vardı"). Doğru şık bu iddiayı metinden bir alıntıyla kanıtlar.

```
A) [İddia konusuyla ilgili ama iddiayı kanıtlamıyor]
B) [DOĞRU — iddiayı en doğrudan kanıtlayan alıntı]
C) [İddiayı dolaylı olarak destekliyor ama en güçlü değil]
D) [İddia konusu değil, yan bir detay]
```

#### Değerlendirme Kriteri:
- "Most directly" — en güçlü, en doğrudan kanıt
- Quotation sorularında alıntının İKİ bileşeni var: (1) iddia edilen duygu/durum + (2) tam tersi gösteren detay

---

### TİP 9 — GRAMMAR: POSSESSIVE
**Pozisyon:** 19
**Adet (modül başına):** 1
**Passage tipi:** Single
**Passage uzunluğu:** 40–80 kelime

#### Soru Kökü (DEĞİŞMEZ):
```
"Which choice completes the text so that it conforms to the conventions of Standard English?"
```

#### Şık Yapısı:
```
A) [people's stories]    ← DOĞRU
B) [peoples story's]     ← İki yanlış aynı anda
C) [peoples stories]     ← İyelik yok, çoğul da yanlış
D) [people's story's]    ← Doğru iyelik, yanlış çoğul
```

#### Test Edilen Kural:
- **Apostrophe + s:** Tekil ismin iyeliği → `person's`
- **S + apostrophe:** Çoğul ismin iyeliği → `peoples'` (people zaten çoğul, `people's` kullanılır)
- **S olmadan:** Çoğul ama iyelik yok → `peoples`
- Yanlış şıklar: gereksiz apostrophe, eksik apostrophe, yanlış konumlu apostrophe

---

### TİP 10 — GRAMMAR: VERB TENSE
**Pozisyon:** 20
**Adet (modül başına):** 1
**Passage tipi:** Single
**Passage uzunluğu:** 40–100 kelime

#### Şık Yapısı:
```
A) [had survived]     ← Past perfect — yanlış zaman
B) [survived]         ← Simple past — yanlış zaman
C) [would survive]    ← Conditional — yanlış mod
D) [survives]         ← DOĞRU — simple present (genel gerçek)
```

#### Test Edilen Kurallar:
- **Simple present:** Genel gerçekler, bilimsel olgular, alışkanlıklar
- **Simple past:** Tamamlanmış tek seferlik eylem
- **Past perfect:** Geçmişte başka bir geçmiş eylemden önce olan
- **Would + infinitive:** Koşullu, alışkanlıksal geçmiş
- **Present perfect:** Geçmişte başlayıp şimdiye uzanan

Bağlam ipuçları: "each year", "in general", "whenever" → present. "In 1985", "last year" → past.

---

### TİP 11 — PUNCTUATION: EM-DASH
**Pozisyon:** 21
**Adet (modül başına):** 1

#### Şık Yapısı:
```
A) [ran—fast—during]   ← Çift dash parenthetical — yanlış mantık
B) [ran—fast during]   ← Tek dash açık kaldı — yanlış
C) [ran—fast, during]  ← Dash + virgül — karışık kullanım
D) [ran—fast. During]  ← DOĞRU — dash ile vurgu, sonra yeni cümle
```

#### Em-Dash Kullanım Kuralları:
- **Vurgu:** `She didn't walk—she ran.` (zorlayıcı kontrast)
- **Parenthetical:** `She—unlike her sister—loved math.` (çift dash gerekli)
- **Açıklama:** `He had one goal—to win.`
- Açık kalan tek dash HER ZAMAN yanlıştır

---

### TİP 12 — GRAMMAR: SUBJECT-VERB AGREEMENT
**Pozisyon:** 22
**Adet (modül başına):** 1

#### Şık Yapısı:
```
A) [are]        ← Çoğul — yanlış
B) [have been]  ← Çoğul perfect — yanlış
C) [were]       ← Çoğul past — yanlış
D) [is]         ← DOĞRU — tekil özne
```

#### Tuzak Yapısı:
Özne ile fiil arasına uzun bir modifier cümlesi girer:
```
"The triangle representing the mountain itself _______ among the few defined figures..."
```
Özne: "The triangle" (tekil) → fiil: "is" (tekil)
Tuzak: "figures" (çoğul) okuyucuyu yanıltır

---

### TİP 13 — PUNCTUATION: SEMICOLON
**Pozisyon:** 23
**Adet (modül başına):** 1

#### Şık Yapısı:
```
A) [sampler later,]     ← Virgül — iki bağımsız cümle birleştirilemiyor
B) [sampler;]           ← DOĞRU — iki bağımsız cümle arası noktalı virgül
C) [sampler,]           ← Virgül splice (comma splice) — yanlış
D) [sampler, later,]    ← Çift virgül — anlamsız
```

#### Kural:
İki bağımsız cümle: ya noktalı virgül (`;`), ya bağlaç ile virgül (`, and`), ya da nokta ile ayrılır. Sadece virgül (comma splice) her zaman YANLIŞ.

---

### TİP 14 — FORM / STRUCTURE / SENSE
**Pozisyon:** 24
**Adet (modül başına):** 1

#### Soru Kökü (DEĞİŞMEZ):
```
"Which choice completes the text so that it conforms to the conventions of Standard English?"
```

#### En Yaygın Format — Dangling Modifier:
```
"Named in 1999 as one of the greatest achievements, _______ led to the first mass-produced treatment."
```

```
A) [Julian synthesized... in 1935; it]        ← Dangling modifier düzeltildi ama yapı kırıldı
B) [in 1935 Julian synthesized..., which]     ← Modifier hala sallanıyor
C) [Julian's 1935 synthesis of the alkaloid]  ← DOĞRU — modifier'ın sahibi isim öbeği
D) [the alkaloid physostigmine was synthesized by Julian]  ← Pasif, modifier sahibi yanlış
```

#### Kural:
Başta gelen participial phrase (geçmiş/şimdiki ortaç) cümlenin öznesini modifiye etmek zorundadır. Özne modifier'ın mantıksal faili olmalı.

---

### TİP 15 — PUNCTUATION: LIST / SEMICOLON IN SERIES
**Pozisyon:** 25
**Adet (modül başına):** 1

#### Şık Yapısı:
```
A) [species, both native and nonnative,]    ← DOĞRU — restrictive olmayan modifier virgülle çevrilir
B) [species, both native and nonnative;]   ← Noktalı virgül ile ayrılan liste şıkları varsa doğru
C) [species; both native and nonnative,]   ← Noktalı virgül yanlış konumda
D) [species both native and nonnative,]    ← Modifier çevresinde virgül eksik
```

#### Kural:
Seri (liste) içinde öğeler kendi içinde virgül taşıyorsa, seri öğeleri noktalı virgülle ayrılır. Basit liste ise virgül kullanılır.

---

### TİP 16 — PUNCTUATION: CONJUNCTIVE ADVERB
**Pozisyon:** 26
**Adet (modül başına):** 1

#### Şık Yapısı:
```
A) [single-handedly, however;]    ← DOĞRU
B) [single-handedly; however,]    ← Noktalı virgül yanlış konumda
C) [single-handedly, however,]    ← İkinci virgül yanlış konumda
D) [single-handedly however]      ← Hiç noktalama yok — yanlış
```

#### Kural:
`however`, `therefore`, `consequently` gibi conjunctive adverb'ler:
- Cümle başında: `However, X...`
- Cümle ortasında: `X; however, Y...` veya `X, however, Y` (bağlama göre)
- İki bağımsız cümle arasında: `X; however, Y` — noktalı virgül ÖNDE, virgül ARKADA

---

### TİP 17 — TRANSITIONS
**Pozisyon:** 27, 28, 29, 30
**Adet (modül başına):** 4
**Passage tipi:** Single

#### Soru Kökü (DEĞİŞMEZ):
```
"Which choice completes the text with the most logical transition?"
```

#### Şık Yapısı:
Her şık farklı bir ilişki tipini temsil eden bağlaç/geçiş kelimesidir:

```
A) [Zaman/Sıralama: Afterward, Finally, Subsequently]
B) [Ekleme: Likewise, Additionally, Similarly, In addition]
C) [Zıtlık: However, Instead, Nevertheless, In contrast]
D) [Sonuç: Therefore, Consequently, As a result, Thus]
```

#### 4 Temel İlişki Tipi:
| İlişki | Bağlaçlar | Bağlam Sinyali |
|--------|-----------|----------------|
| **Zıtlık** | However, Instead, Nevertheless, In contrast | Önceki cümle ile çelişen bir fikir geliyor |
| **Ekleme** | In addition, Furthermore, Similarly, Likewise | Önceki fikre destekleyici bilgi ekleniyor |
| **Sonuç** | Therefore, Thus, Consequently, As a result | Önceki sebepten mantıksal sonuç çıkıyor |
| **Sıralama** | Finally, Afterward, Subsequently | Zaman veya adım sırası var |
| **Örnek** | For example, Specifically | Önceki genellemeyi somutlaştırıyor |

#### Değerlendirme Kriteri:
- Soru 27-30 arası zorluk artar
- İlişkiyi belirlemek için iki cümleyi oku ve şunu sor: "İkinci cümle birinciye ne yapıyor?"
- En yaygın tuzak: "ekleme" ile "sonuç" karıştırmak

---

### TİP 18 — RHETORICAL SYNTHESIS
**Pozisyon:** 31, 32, 33
**Adet (modül başına):** 3
**Passage tipi:** NOTES — 4-6 madde işaretli (•) bullet listesi

#### Soru Kökü Yapısı:
```
"While researching a topic, a student has taken the following notes:
• [Bilgi 1]
• [Bilgi 2]
• [Bilgi 3]
• [Bilgi 4]
• [Bilgi 5]

The student wants to [AMAÇ]. Which choice most effectively uses 
relevant information from the notes to accomplish this goal?"
```

#### AMAÇ KATEGORİLERİ (5 tip):

**Amaç 1 — Fark Vurgula:**
```
"...emphasize a difference between X and Y."
```
Doğru şık: X ve Y'nin farklı olduğu tek spesifik noktayı öne çıkarır.

**Amaç 2 — Benzerlik Vurgula:**
```
"...emphasize a similarity between X and Y."
```
Doğru şık: X ve Y'nin ortak özelliğini açıkça belirtir.

**Amaç 3 — Yabancı Kitleye Tanıt:**
```
"...introduce [eser/kişi/yer] to an audience unfamiliar with [bağlam]."
```
Doğru şık: Kitleye neyin ne olduğunu açıklayan bağlam bilgisini DE içerir.

**Amaç 4 — Bilen Kitleye Sun:**
```
"...present [araştırma] to an audience already familiar with [bağlam]."
```
Doğru şık: Bağlamı açıklamaz, direkt araştırmanın içeriğine girer.

**Amaç 5 — Kişiyi/Eseri Tanımla:**
```
"...describe [eser] to an audience unfamiliar with [kişi]."
```
Doğru şık: Hem kişiyi tanıtır hem eseri betimler.

#### Şık Yapısı (Genel):
```
A) [Amacı karşılamıyor — yanlış bilgiyi ön plana çıkarıyor]
B) [Amacı kısmen karşılıyor — eksik bilgi, tek bullet]
C) [Amacı karşılamıyor — yanlış vurgu]
D) [DOĞRU — amacı tam karşılıyor + en fazla ilgili bilgiyi en verimli taşıyor]
```

#### Değerlendirme Kriteri:
- Doğru şık: (1) Amacı tam karşılar + (2) ilgili bullet'ların bilgisini birleştirir + (3) gereksiz bilgi içermez
- En yaygın tuzak: Amaca uyan ama tek bir bullet'tan bilgi veren şık seçmek
- "Fark" amacında: tam olarak farkı gösteren karşılaştırma ifadesi olmalı ("whereas", "while", "but")
- "Benzerlik" amacında: ortak özelliği açıkça vurgulayan ifade ("both", "neither", "similarly")

---

## PASSAGE TİPLERİ — DETAYLI KURALLAR

### Tip A: Single Passage (Tek Metin)
- **Uzunluk:** 40–180 kelime (tip ve zorluk farkı)
- **Format:** Düz metin bloğu
- **Kaynak:** "The following text is adapted from [yazar]'s [yıl] [eser türü] [eser adı]." formatında başlar
- **Konular:** Bilim, tarih, edebiyat, sosyal bilim, sanat, teknoloji
- **Ton:** Akademik, bilgilendirici veya edebi

### Tip B: Dual Passage (Çift Metin)
- **Sadece:** Cross-text sorusunda (pozisyon 9)
- **Format:**
  ```
  Text 1
  [40-80 kelime — birinci perspektif]
  
  Text 2
  [40-80 kelime — ikinci perspektif]
  ```
- İki metin aynı konuya farklı açıdan bakar

### Tip C: Notes (Not Listesi)
- **Sadece:** Rhetorical Synthesis sorularında (pozisyon 31-33)
- **Format:**
  ```
  • [Bilgi/gerçek 1]
  • [Bilgi/gerçek 2]
  • [Bilgi/gerçek 3]
  • [Bilgi/gerçek 4]
  • [Bilgi/gerçek 5]
  ```
- 4-6 bullet, her biri 1-2 cümle
- Bullet'lar birbiriyle ilişkili ama farklı boyutları kapsıyor
- Passage değil — kaynak bilgisi yok, direkt maddeler

### Grafik/Tablo Kuralları (Claims-Data soruları için)
- Grafik veya tablo passage'dan önce, üstte yer alır
- Her zaman başlık içerir
- Grafik türleri: bar, çizgi, scatter, tablo
- Passage grafiği yorumlar ama boşluk grafikten somut veri ister

---

## ZORLUK DAĞILIMI

### Modül İçi Zorluk Sırası:
```
Soru 1-4   (WIC)        : Easy → Medium
Soru 5-12  (Reading)    : Easy → Medium
Soru 13-18 (Claims)     : Medium
Soru 19-26 (Grammar)    : Easy → Medium
Soru 27-30 (Transitions): Easy → Medium
Soru 31-33 (RS)         : Medium → Hard
```

### Modül 1 vs Modül 2:
- **Modül 1:** Karma zorluk — adaptif sistemin öğrencinin seviyesini belirlemesi için
- **Modül 2:** Modül 1 performansına göre belirlenir
  - İyi performans → Daha zor Modül 2 (daha yüksek skor potansiyeli)
  - Zayıf performans → Daha kolay Modül 2 (düşük skor aralığı)

### Passage Konusu Dağılımı (Modül Başına):
- Bilim/Doğa: ~8-10 soru
- Sosyal Bilim/Tarih: ~8-10 soru
- Edebiyat/Sanat: ~6-8 soru
- Teknoloji/Güncel: ~4-6 soru

Aynı modülde konu tekrarı olmaz.

---

## AI SORU ÜRETİMİ İÇİN ÖZET KURALLAR

Bir AI bu dökümanı okuyarak şu kurallara uymalıdır:

1. **Sıra sabit:** 33 sorunun tipi ve pozisyonu yukarıdaki tabloya göre AYNEN üretilmeli

2. **Passage benzersizliği:** Aynı modülde passage konuları tekrarlanmamalı

3. **Soru kökü kalıpları:** Her tipin soru kökü kalıbına harfiyen uyulmalı (kelimesi kelimesine aynı kalıp)

4. **Distractor kalitesi:** Her yanlış şık belirli bir hata kategorisine ait olmalı, rastgele değil

5. **Passage uzunluğu:** Her tip için belirtilen kelime aralığına uyulmalı

6. **Tek doğru cevap:** 4 şık arasında yalnızca 1 kesin doğru cevap olmalı, diğerleri belirli gerekçelerle elenmeli

7. **Ton:** Tüm passage'lar SAT'ın akademik İngilizce tonunda yazılmalı

8. **Grafik/Tablo:** Claims-Data soruları (pos. 13, 15, 17) için MUTLAKA grafik veya tablo üretilmeli ve passage ile tutarlı olmalı

9. **Notes formatı:** Rhetorical Synthesis soruları (pos. 31-33) için passage OLMAMALI, yalnızca bullet listesi olmalı

10. **Doğru cevap dağılımı:** Tek modülde A, B, C, D cevapları yaklaşık eşit dağılmalı (her şık ~8 kez)