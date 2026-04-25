import { create } from "zustand";

// Only allow string-valued keys to prevent calling functions via updateField
type StringFields = "legalName" | "govtId" | "employmentType" | "annualIncome" | "loanAmount";

interface ApplicationState {
  legalName: string;
  govtId: string;
  employmentType: string;
  annualIncome: string;
  loanAmount: string;
  lastApplicationId: string | null;
  updateField: (field: StringFields, value: string) => void;
  setLastApplicationId: (id: string) => void;
  reset: () => void;
}

export const useApplicationStore = create<ApplicationState>((set) => ({
  legalName: "",
  govtId: "",
  employmentType: "Salaried Full-Time",
  annualIncome: "",
  loanAmount: "50000",
  lastApplicationId: null,
  updateField: (field, value) => set((state) => ({ ...state, [field]: value })),
  setLastApplicationId: (id) => set({ lastApplicationId: id }),
  reset: () =>
    set({
      legalName: "",
      govtId: "",
      employmentType: "Salaried Full-Time",
      annualIncome: "",
      loanAmount: "50000",
    }),
}));
