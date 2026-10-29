import { useState, useCallback } from 'react';
import { generateAIResponse } from '../ai/engine';
import { MOCK } from '../utils/constants';

export function useAIChat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm **CHUTTEE AI** — your production copilot. Ask me about budget, scenes, cast, risks, or anything else.",
      timestamp: new Date(),
    },
  ]);
  const [thinking, setThinking] = useState(false);

  const context = {
    project: MOCK.projects?.[0],
    crew: MOCK.crew,
    cast: MOCK.cast,
    scenes: MOCK.scenes,
    transactions: MOCK.transactions,
    budgetByDept: MOCK.budgetByDept,
    risks: MOCK.ai?.filter((a) => a.kind === 'risk') || [],
    activity: MOCK.activity,
  };

  const send = useCallback(async (text) => {
    if (!text?.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), role: 'user', text, timestamp: new Date() }]);
    setThinking(true);

    try {
      const response = await generateAIResponse(text, context);
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: 'assistant', text: response.text, actions: response.actions, widgets: response.widgets, timestamp: new Date() },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: Date.now() + 2, role: 'assistant', text: 'Sorry, I hit an error. Try again?', timestamp: new Date(), error: true },
      ]);
    } finally {
      setThinking(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([{ id: 'welcome', role: 'assistant', text: 'Chat cleared. What would you like to know?', timestamp: new Date() }]);
  }, []);

  return { messages, thinking, send, clear };
}