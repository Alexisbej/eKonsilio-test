export class CreateMessageDto {
  content: string;
  conversationId: string;
}

export class MessageResponseDto {
  id: string;
  content: string;
  conversationId: string;
  userId: string;
  createdAt: Date;
  user?: {
    id: string;
    name?: string;
    role: string;
  };
}
