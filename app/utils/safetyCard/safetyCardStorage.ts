import type { SafetyCardDocument } from "@/types/safetyCardTypes";

const STORAGE_KEY = "safety_cards_v1";
const ACTIVE_KEY = "safety_card_active_id";

function load(): SafetyCardDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SafetyCardDocument[]) : [];
  } catch {
    return [];
  }
}

function save(docs: SafetyCardDocument[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function listDocuments(): SafetyCardDocument[] {
  return load().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getDocument(id: string): SafetyCardDocument | null {
  return load().find((d) => d.id === id) ?? null;
}

export function upsertDocument(doc: SafetyCardDocument): void {
  const docs = load();
  const idx = docs.findIndex((d) => d.id === doc.id);
  const updated = { ...doc, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    docs[idx] = updated;
  } else {
    docs.push(updated);
  }
  save(docs);
}

export function deleteDocument(id: string): void {
  save(load().filter((d) => d.id !== id));
  if (getActiveId() === id) clearActiveId();
}

export function getActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_KEY, id);
}

export function clearActiveId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_KEY);
}

export function exportDocumentJson(doc: SafetyCardDocument): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `safety-card-${doc.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
