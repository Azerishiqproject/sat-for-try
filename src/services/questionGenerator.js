// src/services/questionGenerator.js
import { callGPT } from './aiService';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  serverTimestamp 
} from "firebase/firestore";

const TEMPLATES_COLLECTION = "question_templates";
const QUESTIONS_COLLECTION = "questions";

const FIXED_STEMS = {
  'words_in_context': 'Which choice completes the text with the most logical and precise word or phrase?',
  'main_purpose': 'Which choice best states the main purpose of the text?',
  'text_structure': 'Which choice best describes the overall structure of the text?',
  'cross_text': 'Based on the texts, how would the author of Text 2 most likely respond to the claim presented in Text 1?',
  'main_idea': 'Which choice best states the main idea of the text?',
  'inference': 'Which choice most logically completes the text?',
  'claims_data': 'Which choice most effectively uses data from the [reference] to complete the statement?',
  'claims_evidence': 'Which choice most directly supports the hypothesis?',
  'transitions': 'Which choice completes the text with the most logical transition?',
  'rhetorical_synthesis': 'The student wants to [GOAL]. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
  'standard_english': 'Which choice completes the text so that it conforms to the conventions of Standard English?'
};

const DOMAIN_MAPPING = {
  'words_in_context': 'Craft and Structure',
  'main_purpose': 'Craft and Structure',
  'text_structure': 'Craft and Structure',
  'cross_text': 'Craft and Structure',
  'main_idea': 'Information and Ideas',
  'inference': 'Information and Ideas',
  'claims_data': 'Information and Ideas',
  'claims_evidence': 'Information and Ideas',
  'transitions': 'Expression of Ideas',
  'rhetorical_synthesis': 'Expression of Ideas',
  'standard_english': 'Standard English Conventions'
};

const TYPE_INSTRUCTIONS = {
  'text_structure': 'Enforce the "2 Movements" rule: The passage must consist of two distinct logical movements (e.g., presenting a theory then questioning it, or describing a phenomenon then explaining its significance).',
  'cross_text': 'This must be a DUAL passage. Text 1 presents a specific perspective or conventional wisdom. Text 2 presents a conflicting or more nuanced perspective. The question asks for Text 2\'s response to Text 1.',
  'rhetorical_synthesis': 'The passage must be a list of 5-6 bulleted research notes. DO NOT write a cohesive paragraph. The goal is to synthesize specific data points into a single sentence response.',
  'words_in_context': 'Use exactly 4 distractors categorized as: 1 correct, 1 semantically similar but contextually wrong, 1 related to topic but grammatically wrong, and 1 too general.',
  'claims_data': 'Include specific quantitative data (numbers, percentages, or comparisons) in the passage or as a descriptive "table" in text format. The correct answer must be verifiable by this data.'
};

const GENERATION_PROMPT = (params) => {
  const { question_type, difficulty, topic, passage_type, pos, subtype, template_example } = params;
  
  const stem = FIXED_STEMS[question_type] || FIXED_STEMS['standard_english'];
  const specificInstruction = TYPE_INSTRUCTIONS[subtype] || TYPE_INSTRUCTIONS[question_type] || '';

  return `
You are a professional SAT Question Writer (College Board Expert) creating high-quality SAT Reading & Writing questions.

### CORE INSTRUCTIONS & SAT HEURISTICS:
1. **STYLE & TONALITY:** High-level academic English. Authoritative, formal, and precise.
2. **DISTRACTOR LOGIC:** Follow the "SAT Distractor Patterns" (too narrow, too broad, plausible but unsupported, inverted meaning, or true but unrelated).
3. **EXPLANATION RIGOR:** The "correct_answer_explanation" must include detailed logical reasoning in English, explicitly outlining why the correct answer is mandated and why distractors are wrong.

### OUTPUT FORMAT REQUIREMENTS (JSON ONLY):
{
  "passage_text": "<passage or bulleted notes list>",
  "question_stem": "<the provided stem>",
  "options": {
    "A": "<option A>",
    "B": "<option B>",
    "C": "<option C>",
    "D": "<option D>"
  },
  "correct_answer": "A | B | C | D",
  "topic": "<the target topic>",
  "difficulty": "<the target difficulty>",
  "correct_answer_explanation": "<Detailed logical reasoning in English, explaining why the answer is correct and why distractors are wrong.>",
  "passage_type": "<prose or notes>",
  "has_data": <boolean>
}

---

### SPECIFIC GENERATION PARAMETERS:
- POSITION: ${pos}
- QUESTION TYPE: ${question_type} (${subtype})
- DIFFICULTY: ${difficulty}
- TOPIC: ${topic}
- PASSAGE TYPE: ${passage_type} (Mode: ${passage_type === 'notes' ? 'BULLETED NOTES' : 'PROSE'})
- MANDATORY QUESTION STEM: "${stem}"
- TYPE INSTRUCTION: ${specificInstruction}

### REFERENCE TEMPLATE:
${template_example}
`;
};

export const generateQuestion = async (params, options = {}) => {
  const prompt = GENERATION_PROMPT(params);
  return await callGPT(prompt, options);
};

export const generateAndSaveQuestion = async (params, options = {}) => {
  const { template_id } = params;
  
  let template_example = params.template_example;
  let templateData = null;
  
  if (template_id && !template_example) {
    const docRef = doc(db, TEMPLATES_COLLECTION, template_id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      templateData = snap.data();
      template_example = JSON.stringify(templateData, null, 2);
    }
  }

  // Set specific difficulty based on position as per Sat.md
  let difficulty = params.difficulty || 'medium';
  if (params.pos <= 4) difficulty = params.pos <= 2 ? 'easy' : 'medium';
  if (params.pos >= 31) difficulty = 'hard';

  const { data: aiData, usage } = await generateQuestion({
    ...params,
    difficulty,
    template_example: template_example || 'None provided. Generate from scratch following SAT standards.'
  }, options);

  // Handle AI returning passage_text as an array (common for Dual Passages)
  let finalizedPassage = aiData.passage_text;
  if (Array.isArray(finalizedPassage)) {
    finalizedPassage = finalizedPassage.join('\n\n');
  }

  const questionData = {
    template_id: template_id || null,
    question_type: params.question_type || (templateData ? templateData.question_type : 'words_in_context'),
    difficulty: difficulty,
    ...aiData,
    topic: params.topic || DOMAIN_MAPPING[params.question_type] || aiData.topic || (templateData ? templateData.passage_topic : 'Information and Ideas'),
    passage_text: finalizedPassage,
    created_at: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, QUESTIONS_COLLECTION), questionData);
  return { data: { id: docRef.id, ...questionData }, usage };
};
