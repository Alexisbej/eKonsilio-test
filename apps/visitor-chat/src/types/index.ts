export enum UserRole {
  VISITOR = "VISITOR",
  AGENT = "AGENT",
  ADMIN = "ADMIN",
}

export enum ConversationStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  createdAt: string;
  userId?: string;
  user?: User;
}

export interface Conversation {
  id: string;
  title: string;
  status: "PENDING" | "ACTIVE" | "CLOSED";
  lastMessage?: string;
  lastMessageTime?: Date;
  updatedAt: string;
  unreadCount?: number;
  user: User;
  messages: Message[];
}

export interface VisitorInfo {
  name: string;
  email: string;
}