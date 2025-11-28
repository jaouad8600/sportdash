export type GroupState = "Groen" | "Geel" | "Oranje" | "Rood";

export type Note = {
  id: string;
  text: string;
  author?: string;
  createdAt: string; // ISO string
  starred?: boolean;
};

export type Group = {
  id: string;
  name: string;
  state: GroupState;
  note?: string; // laatste notitie tekst (samenvatting)
  notes?: Note[]; // volledige notitielijst
};

export type DB = any;
