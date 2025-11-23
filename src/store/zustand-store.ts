import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, ChartConfig, UIState } from '@/types';

interface AppState {
  // UI State
  ui: UIState;
  
  // Chat State
  chatMessages: Message[];
  isAiTyping: boolean;
  currentChatId: string | null;
  chatSessions: { [key: string]: { name: string; messages: Message[]; createdAt: string } };
  
  // Forecast State
  forecastConfig: ChartConfig;
  isForecasting: boolean;
  
  // Table State
  selectedRowIds: string[];
  
  // Actions
  setUI: (_updates: Partial<UIState>) => void;
  addChatMessage: (_message: Message) => void;
  setChatMessages: (_messages: Message[]) => void;
  setAiTyping: (_typing: boolean) => void;
  setCurrentChatId: (_id: string | null) => void;
  createNewChat: (_name?: string) => string;
  loadChat: (_id: string) => void;
  renameChat: (_id: string, _name: string) => void;
  deleteChat: (_id: string) => void;
  clearChat: () => void;
  setForecastConfig: (_config: Partial<ChartConfig>) => void;
  setForecasting: (_forecasting: boolean) => void;
  setSelectedRowIds: (_ids: string[]) => void;
  reset: () => void;
}

const initialState = {
  ui: {
    sidebarCollapsed: false,
    activePanel: 'data' as const,
    theme: 'light' as const,
  },
  chatMessages: [],
  isAiTyping: false,
  currentChatId: null,
  chatSessions: {},
  forecastConfig: {
    showForecast: false,
    forecastDays: 14,
    selectedProductId: null,
  },
  isForecasting: false,
  selectedRowIds: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUI: (_updates) =>
        set((state) => ({
          ui: { ...state.ui, ..._updates },
        })),
      
      addChatMessage: (_message) =>
        set((state) => {
          const newMessages = [...state.chatMessages, _message];
          let updatedSessions = { ...state.chatSessions };
          
          // Update the current chat session with the new messages
          if (state.currentChatId && state.chatSessions[state.currentChatId]) {
            updatedSessions[state.currentChatId] = {
              ...state.chatSessions[state.currentChatId],
              messages: newMessages
            };
          }
          
          // If this is the first user message and the chat name is still generic, update it
          if (_message.role === 'user' && state.currentChatId && state.chatMessages.length === 0) {
            const currentSession = updatedSessions[state.currentChatId];
            if (currentSession && currentSession.name.startsWith('Chat ')) {
              // Generate a title from the first message (truncate to 50 chars)
              const titleFromMessage = _message.content.length > 50 
                ? _message.content.substring(0, 50) + '...'
                : _message.content;
              
              updatedSessions[state.currentChatId] = {
                ...currentSession,
                name: titleFromMessage
              };
            }
          }
          
          return {
            chatMessages: newMessages,
            chatSessions: updatedSessions
          };
        }),
      
      setChatMessages: (_messages) =>
        set({ chatMessages: _messages }),
      
      setAiTyping: (_typing: boolean) =>
        set({ isAiTyping: _typing }),
      
      setCurrentChatId: (_id: string | null) =>
        set({ currentChatId: _id }),
      
      createNewChat: (_name?: string) => {
        const chatId = `chat-${Date.now()}`;
        
        set((state) => {
          let chatName = _name;
          
          if (!chatName) {
            // Generate unique name by checking existing names
            const existingNames = Object.values(state.chatSessions).map((session: any) => session.name);
            let counter = 1;
            do {
              chatName = `Chat ${counter}`;
              counter++;
            } while (existingNames.includes(chatName));
          }
          
          return {
            currentChatId: chatId,
            chatSessions: {
              ...state.chatSessions,
              [chatId]: {
                name: chatName,
                messages: [],
                createdAt: new Date().toISOString(),
              },
            },
            chatMessages: [],
          };
        });
        return chatId;
      },
      
      loadChat: (_id: string) =>
        set((state) => {
          const session = state.chatSessions[_id];
          if (session) {
            return {
              currentChatId: _id,
              chatMessages: session.messages,
            };
          }
          return state;
        }),
      
      renameChat: (_id: string, _name: string) =>
        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [_id]: {
              ...state.chatSessions[_id],
              name: _name,
            },
          },
        })),
      
      deleteChat: (_id: string) =>
        set((state) => {
          const newSessions = { ...state.chatSessions };
          delete newSessions[_id];
          
          let newCurrentId = state.currentChatId;
          let newMessages = state.chatMessages;
          
          // If we're deleting the current chat
          if (state.currentChatId === _id) {
            const remainingChatIds = Object.keys(newSessions);
            
            if (remainingChatIds.length > 0) {
              // Switch to the most recent chat (last in the array)
              const mostRecentChatId = remainingChatIds[remainingChatIds.length - 1];
              newCurrentId = mostRecentChatId;
              newMessages = newSessions[mostRecentChatId].messages;
            } else {
              // No chats left, go to "no chat" state
              newCurrentId = null;
              newMessages = [];
            }
          }
          
          return {
            chatSessions: newSessions,
            currentChatId: newCurrentId,
            chatMessages: newMessages,
          };
        }),
      
      setForecastConfig: (_config: Partial<ChartConfig>) =>
        set((state) => ({
          forecastConfig: { ...state.forecastConfig, ..._config },
        })),
      
      setForecasting: (_forecasting: boolean) =>
        set({ isForecasting: _forecasting }),
      
      setSelectedRowIds: (_ids: string[]) =>
        set({ selectedRowIds: _ids }),
      
      clearChat: () =>
        set({ chatMessages: [], isAiTyping: false }),
      
      reset: () =>
        set(initialState),
    }),
    {
      name: 'pukpuk-store',
      partialize: (state) => ({
        ui: state.ui,
        forecastConfig: state.forecastConfig,
        chatMessages: state.chatMessages,
        currentChatId: state.currentChatId,
        chatSessions: state.chatSessions,
      }),
    }
  )
);