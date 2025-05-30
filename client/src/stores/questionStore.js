import { create } from "zustand";
import api from "../utils/api";
import toast from "react-hot-toast";
import useAuthStore from "./authStore";

const useQuestionStore = create((set, get) => ({
  questions: [],
  documentQuestions: {},
  currentQuestion: null,
  validationResult: null,
  isLoading: false,
  error: null,

  generateQuestions: async (documentId, options) => {
    const token = useAuthStore.getState().token;

    if (!token) {
      toast.error("You must be logged in");
      return { success: false, error: "Authentication required" };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.post(
        `/api/questions/generate/${documentId}`,
        options,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      set((state) => ({
        documentQuestions: {
          ...state.documentQuestions,
          [documentId]: response.data.data,
        },
        isLoading: false,
      }));

      return {
        success: true,
        count: response.data.count,
        data: response.data.data,
        preview: response.data.preview,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to generate questions";
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  getAllQuestions: async () => {
    const token = useAuthStore.getState().token;

    if (!token) {
      toast.error("You must be logged in");
      return { success: false, error: "Authentication required" };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.get("/api/questions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set({
        questions: response.data.data,
        isLoading: false,
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch questions";
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  getQuestionsByDocument: async (documentId) => {
    const token = useAuthStore.getState().token;

    if (!token) {
      toast.error("You must be logged in");
      return { success: false, error: "Authentication required" };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.get(`/api/questions/document/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set((state) => ({
        documentQuestions: {
          ...state.documentQuestions,
          [documentId]: response.data.data,
        },
        questions: response.data.data,
        isLoading: false,
      }));

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch questions";
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  fetchQuestionsByDocument: async (documentId) => {
    return get().getQuestionsByDocument(documentId);
  },

  getQuestionById: async (id) => {
    const token = useAuthStore.getState().token;

    if (!token) {
      toast.error("You must be logged in");
      return { success: false, error: "Authentication required" };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.get(`/api/questions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set({
        currentQuestion: response.data.data,
        isLoading: false,
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch question";
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  validateAnswer: async (questionId, userAnswer) => {
    const token = useAuthStore.getState().token;

    if (!token) {
      toast.error("You must be logged in");
      return { success: false, error: "Authentication required" };
    }

    set({ isLoading: true, error: null, validationResult: null });

    try {
      const response = await api.post(
        `/api/questions/${questionId}/validate`,
        {
          userAnswer,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      set({
        validationResult: response.data.data,
        isLoading: false,
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to validate answer";
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  validateExam: async (examData) => {
    const token = useAuthStore.getState().token;

    if (!token) {
      toast.error("You must be logged in");
      return { success: false, error: "Authentication required" };
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.post(
        `/api/questions/validate-exam`,
        { answers: examData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      set({ isLoading: false });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to validate exam";
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteQuestion: async (id) => {
    const token = useAuthStore.getState().token;

    if (!token) {
      toast.error("You must be logged in");
      return { success: false, error: "Authentication required" };
    }

    set({ isLoading: true, error: null });

    try {
      await api.delete(`/api/questions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set((state) => {
        const updatedQuestions = state.questions.filter((q) => q._id !== id);

        const updatedDocumentQuestions = {};
        Object.keys(state.documentQuestions).forEach((docId) => {
          updatedDocumentQuestions[docId] = state.documentQuestions[
            docId
          ].filter((q) => q._id !== id);
        });

        return {
          questions: updatedQuestions,
          documentQuestions: updatedDocumentQuestions,
          isLoading: false,
        };
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete question";
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearCurrentQuestion: () => {
    set({
      currentQuestion: null,
      validationResult: null,
    });
  },

  clearValidationResult: () => {
    set({ validationResult: null });
  },
}));

export default useQuestionStore;
