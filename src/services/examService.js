// src/services/examService.js
import { db } from "../firebase";
import { generateAndSaveQuestion } from "./questionGenerator";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  setDoc,
  limit
} from "firebase/firestore";


const EXAMS_COLLECTION = "exams";
const QUESTIONS_COLLECTION = "questions";
const STATS_DOC = "admin/stats"; // Centralized stats


export const examService = {
  // Listen to all exams for a specific user (hardcoded 'admin' for now)
  subscribeToExams: (callback) => {
    const q = query(
      collection(db, EXAMS_COLLECTION),
      orderBy("created_at", "desc"),
      limit(20)
    );
    return onSnapshot(q, (snapshot) => {
      const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(exams);
    });
  },

  // Create a new exam shell
  createExam: async (examData) => {
    const newExam = {
      ...examData,
      status: examData.status || "ready",
      progress: 0,
      module1_score: 0,
      module2_score: 0,
      total_score: 0,
      created_at: serverTimestamp(),
      is_retake: examData.is_retake || false,
    };
    const docRef = await addDoc(collection(db, EXAMS_COLLECTION), newExam);
    return { id: docRef.id, ...newExam };
  },

  // Update exam status or results
  updateExam: async (examId, updates) => {
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
  },

  // Delete an exam
  deleteExam: async (examId) => {
    await deleteDoc(doc(db, EXAMS_COLLECTION, examId));
  },

  // Get a single exam
  getExam: async (examId) => {
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    const snap = await getDoc(docRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
  },

  // Fetch or query questions
  getQuestions: async (ids) => {
    // Firestore has a limit of 30 for 'in' queries, so we chunk them if needed
    if (!ids || ids.length === 0) return [];
    
    const results = [];
    for (let i = 0; i < ids.length; i += 30) {
      const chunk = ids.slice(i, i + 30);
      const q = query(collection(db, QUESTIONS_COLLECTION), where("__name__", "in", chunk));
      const snap = await getDocs(q);
      snap.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    }
    return results;
  },

  // Start a new Attempt from a Master Exam
  startAttempt: async (masterExamId) => {
    const master = await examService.getExam(masterExamId);
    if (!master) throw new Error("Master exam not found");

    const attemptData = {
      title: `${master.title} (Attempt)`,
      exam_type: master.exam_type,
      status: "ready", // Player will start it
      module1_questions: master.module1_questions || [],
      module2_questions: master.module2_questions || [],
      user_id: master.user_id || "admin",
      is_attempt: true, // Mark it clearly
      master_id: masterExamId, // Reference back
      created_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, EXAMS_COLLECTION), attemptData);
    return { id: docRef.id, ...attemptData };
  },

  // NEW: Generate a full 66-question exam
  generateFullExam: async (examId, onProgress) => {
    const examDoc = await examService.getExam(examId);
    if (!examDoc) throw new Error("Exam not found");

    const MODULE_DIST = [
      { pos: 1, type: 'words_in_context' }, { pos: 2, type: 'words_in_context' },
      { pos: 3, type: 'words_in_context' }, { pos: 4, type: 'words_in_context' },
      { pos: 5, type: 'words_in_context' }, { pos: 6, type: 'words_in_context' },
      { pos: 7, type: 'words_in_context' }, { pos: 8, type: 'words_in_context' },
      { pos: 9, type: 'main_purpose' }, { pos: 10, type: 'text_structure' },
      { pos: 11, type: 'cross_text' }, { pos: 12, type: 'main_idea' },
      { pos: 13, type: 'main_idea' }, { pos: 14, type: 'inference' },
      { pos: 15, type: 'inference' }, { pos: 16, type: 'claims_data', has_data: true },
      { pos: 17, type: 'claims_evidence' }, { pos: 18, type: 'words_in_context' }, 
      { pos: 19, type: 'standard_english' }, { pos: 20, type: 'standard_english' },
      { pos: 21, type: 'standard_english' }, { pos: 22, type: 'standard_english' },
      { pos: 23, type: 'standard_english' }, { pos: 24, type: 'standard_english' },
      { pos: 25, type: 'standard_english' }, { pos: 26, type: 'standard_english' },
      { pos: 27, type: 'transitions' }, { pos: 28, type: 'transitions' },
      { pos: 29, type: 'transitions' }, { pos: 30, type: 'transitions' },
      { pos: 31, type: 'rhetorical_synthesis', subtype: 'rhetorical_synthesis' },
      { pos: 32, type: 'rhetorical_synthesis', subtype: 'rhetorical_synthesis' },
      { pos: 33, type: 'rhetorical_synthesis', subtype: 'rhetorical_synthesis' }
    ];

    let totalCost = 0;
    const m1Questions = [];
    const m2Questions = [];

    // Find templates (First 10 for diversity)
    const templatesSnap = await getDocs(query(collection(db, "question_templates"), orderBy("created_at", "desc")));
    const templates = templatesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const generateModule = async (moduleType, questionsArray) => {
      for (const item of MODULE_DIST) {
        const template = templates.find(t => t.question_type === item.type) || null;
        
        const { data: gq, usage } = await generateAndSaveQuestion({
          template_id: template ? template.id : null,
          question_type: item.type,
          subtype: item.subtype,
          has_data: item.has_data,
          pos: item.pos
        }, { timeout: 40000 });

        totalCost += (usage?.cost || 0);
        questionsArray.push(gq.id);
        
        const currentProgress = m1Questions.length + m2Questions.length;
        await examService.updateExam(examId, { progress: currentProgress });
        if (onProgress) onProgress(currentProgress, totalCost);
      }
    };

    // Generate Module 1
    await generateModule(1, m1Questions);
    await examService.updateExam(examId, { 
      module1_questions: m1Questions,
      status: 'generating_m2' 
    });

    // Generate Module 2
    await generateModule(2, m2Questions);
    
    await examService.updateExam(examId, { 
      module2_questions: m2Questions,
      status: 'ready' 
    });

    return { m1: m1Questions, m2: m2Questions, totalCost };
  },

  // NEW: Global Stats Tracking
  getGlobalStats: (callback) => {
    const docRef = doc(db, STATS_DOC);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) callback(snap.data());
      else callback({ total_cost: 0 });
    });
  },

  incrementTotalCost: async (amount) => {
    const docRef = doc(db, STATS_DOC);
    try {
      await updateDoc(docRef, {
        total_cost: increment(amount)
      });
    } catch (err) {
      // If doc doesn't exist, create it
      await setDoc(docRef, { total_cost: amount }, { merge: true });
    }
  }
};

