export type PresetTransaction = {
  description: string;
  type: "expense" | "income";
  category: string;
  minAmount: number;
  maxAmount: number;
  fixedAmounts?: number[];
  isCustom?: boolean;
};

export const TRANSACTION_CATEGORIES = [
  "Spesa e supermercati",
  "Generi alimentari e supermercato",
  "Ristorazione e bar",
  "Ristoranti e bar",
  "Trasporti",
  "Carburanti",
  "Casa",
  "Prelievi",
  "Bonifici ricevuti",
  "Altre uscite",
  "Salute e benessere",
  "Tempo libero",
  "Tabaccai e simili",
  "Tasse e bolli",
  "Trasferimenti",
  "Sanità",
  "Trasporti e viaggi",
  "Servizi",
];

export const DEFAULT_PRESETS: PresetTransaction[] = [];
