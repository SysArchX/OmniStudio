"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { AgentLogEntry, AgentStep, Conversation, ViewId } from "./types";
import type { TreeEntry } from "./agent";
import type { SearchHit } from "./ai";

const CHATS_KEY = "omnistudio.chats.v1";

export interface StudioBridge {
  testVoice: () => void;
  exportVideo: () => void;
  hasScenes: boolean;
  title: string;
  duration: number;
}

export interface AgentBridge {
  steps: AgentStep[];
  logs: AgentLogEntry[];
  tree: TreeEntry[];
  root: string;
  running: boolean;
}

interface WorkspaceContextValue {
  view: ViewId;
  setView: (view: ViewId) => void;
  inspectorOpen: boolean;
  toggleInspector: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  conversations: Conversation[];
  activeId: string | null;
  active: Conversation | null;
  setActiveId: (id: string) => void;
  createConversation: () => string;
  removeConversation: (id: string) => void;
  patchConversation: (id: string, patch: Partial<Conversation>) => void;
  sources: SearchHit[];
  setSources: (hits: SearchHit[]) => void;
  studioCanvas: RefObject<HTMLCanvasElement | null>;
  studio: StudioBridge | null;
  registerStudio: (bridge: StudioBridge | null) => void;
  agent: AgentBridge | null;
  registerAgent: (bridge: AgentBridge | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace precisa estar dentro de WorkspaceProvider");
  return ctx;
}

function loadConversations(): Conversation[] {
  try {
    const raw = window.localStorage.getItem(CHATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function newConversation(): Conversation {
  const now = Date.now();
  return { id: crypto.randomUUID(), title: "Nova conversa", messages: [], createdAt: now, updatedAt: now };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<ViewId>("chat");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchHit[]>([]);
  const [studio, setStudio] = useState<StudioBridge | null>(null);
  const [agent, setAgent] = useState<AgentBridge | null>(null);
  const studioCanvas = useRef<HTMLCanvasElement | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    const stored = loadConversations();
    setConversations(stored);
    setActiveId(stored[0]?.id ?? null);
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(CHATS_KEY, JSON.stringify(conversations.slice(0, 40)));
    } catch {
      /* quota cheia */
    }
  }, [conversations]);

  const setView = useCallback((next: ViewId) => {
    setViewState(next);
    setMobileSidebarOpen(false);
  }, []);

  const createConversation = useCallback(() => {
    const fresh = newConversation();
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setSources([]);
    setViewState("chat");
    return fresh.id;
  }, []);

  const removeConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setActiveId((current) => (current === id ? next[0]?.id ?? null : current));
      return next;
    });
  }, []);

  const patchConversation = useCallback((id: string, patch: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item)),
    );
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      view,
      setView,
      inspectorOpen,
      toggleInspector: () => setInspectorOpen((prev) => !prev),
      mobileSidebarOpen,
      setMobileSidebarOpen,
      conversations,
      activeId,
      active: conversations.find((item) => item.id === activeId) ?? null,
      setActiveId,
      createConversation,
      removeConversation,
      patchConversation,
      sources,
      setSources,
      studioCanvas,
      studio,
      registerStudio: setStudio,
      agent,
      registerAgent: setAgent,
    }),
    [
      view,
      setView,
      inspectorOpen,
      mobileSidebarOpen,
      conversations,
      activeId,
      createConversation,
      removeConversation,
      patchConversation,
      sources,
      studio,
      agent,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}