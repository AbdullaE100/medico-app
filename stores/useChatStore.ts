import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  chat_id: string | null;
  group_id: string | null;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  file_url?: string;
  file_type?: string;
  file_name?: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
}

interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  user_id?: string;
  doctor_id?: string;
  group_id?: string;
  is_archived: boolean;
  is_muted: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message?: string | null;
  unread_count: number;
  other_user?: {
    full_name: string;
    avatar_url: string;
    specialty: string;
    is_online: boolean;
  };
  members?: {
    id: string;
    full_name: string;
    avatar_url: string;
  }[];
}

interface ChatState {
  chats: Chat[];
  messages: Message[];
  currentChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  subscriptions: { unsubscribe: () => void }[];
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendMediaMessage: (params: { 
    content: string; 
    type: 'image' | 'file'; 
    file_url: string; 
    file_name: string; 
    file_type?: string;
  }) => Promise<void>;
  subscribeToMessages: (chatId: string) => void;
  startChat: (doctorId: string) => Promise<string>;
  createGroupChat: (name: string, memberIds: string[]) => Promise<string>;
  archiveChat: (chatId: string) => Promise<void>;
  unarchiveChat: (chatId: string) => Promise<void>;
  muteChat: (chatId: string) => Promise<void>;
  unmuteChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  clearChat: (chatId: string) => Promise<void>;
  cleanup: () => void;
}

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any): string => {
  console.error('Supabase error:', error);
  
  if (error?.code === '23514') {
    return 'Invalid message target. Please try again.';
  }
  
  if (error?.message?.includes('not authenticated')) {
    return 'You must be logged in to perform this action.';
  }

  return error?.message || 'An unexpected error occurred';
};

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: [],
  currentChat: null,
  isLoading: false,
  error: null,
  subscriptions: [],

  fetchChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch direct chats
      const { data: directChats, error: directChatsError } = await supabase
        .from('chats')
        .select(`
          *,
          other_user:profiles!chats_doctor_id_fkey(
            full_name,
            avatar_url,
            specialty
          ),
          messages:chat_messages(
            content,
            created_at,
            is_read
          )
        `)
        .or(`user_id.eq.${user.id},doctor_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (directChatsError) throw directChatsError;

      // Fetch group chats
      const { data: groupChats, error: groupChatsError } = await supabase
        .from('chat_groups')
        .select(`
          *,
          members:chat_group_members(
            profiles(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .order('last_message_at', { ascending: false });

      if (groupChatsError) throw groupChatsError;

      // Process and combine chats
      const processedDirectChats = (directChats || []).map(chat => ({
        ...chat,
        type: 'direct' as const,
        last_message: chat.messages?.[0]?.content,
        unread_count: chat.messages?.filter(
          (m: any) => !m.is_read && m.sender_id !== user.id
        ).length || 0,
        messages: undefined
      }));

      const processedGroupChats = (groupChats || []).map(chat => ({
        ...chat,
        type: 'group' as const,
        members: chat.members?.map((m: any) => m.profiles) || [],
      }));

      set({ 
        chats: [...processedDirectChats, ...processedGroupChats].sort(
          (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        )
      });
    } catch (error) {
      set({ error: handleSupabaseError(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  startChat: async (doctorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check for existing chat
      const { data: existingChat, error: findError } = await supabase
        .from('chats')
        .select('*')
        .or(`user_id.eq.${user.id},doctor_id.eq.${user.id}`)
        .eq(user.id === doctorId ? 'user_id' : 'doctor_id', doctorId)
        .single();

      if (findError && findError.code !== 'PGRST116') throw findError;

      if (existingChat) {
        return existingChat.id;
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          doctor_id: doctorId,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Refresh chats list
      await get().fetchChats();

      return newChat.id;
    } catch (error) {
      set({ error: handleSupabaseError(error) });
      throw error;
    }
  },

  createGroupChat: async (name: string, memberIds: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
          name,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add members (including creator)
      const members = [...new Set([...memberIds, user.id])];
      const { error: membersError } = await supabase
        .from('chat_group_members')
        .insert(
          members.map(memberId => ({
            group_id: group.id,
            member_id: memberId,
            role: memberId === user.id ? 'admin' : 'member'
          }))
        );

      if (membersError) throw membersError;

      // Refresh chats list
      await get().fetchChats();

      return group.id;
    } catch (error) {
      set({ error: handleSupabaseError(error) });
      throw error;
    }
  },

  archiveChat: async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ is_archived: true })
        .eq('id', chatId);

      if (error) throw error;

      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId ? { ...chat, is_archived: true } : chat
        )
      }));
    } catch (error) {
      set({ error: handleSupabaseError(error) });
    }
  },

  unarchiveChat: async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ is_archived: false })
        .eq('id', chatId);

      if (error) throw error;

      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId ? { ...chat, is_archived: false } : chat
        )
      }));
    } catch (error) {
      set({ error: handleSupabaseError(error) });
    }
  },

  muteChat: async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ is_muted: true })
        .eq('id', chatId);

      if (error) throw error;

      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId ? { ...chat, is_muted: true } : chat
        )
      }));
    } catch (error) {
      set({ error: handleSupabaseError(error) });
    }
  },

  unmuteChat: async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ is_muted: false })
        .eq('id', chatId);

      if (error) throw error;

      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId ? { ...chat, is_muted: false } : chat
        )
      }));
    } catch (error) {
      set({ error: handleSupabaseError(error) });
    }
  },

  deleteChat: async (chatId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      set((state) => ({
        chats: state.chats.filter((chat) => chat.id !== chatId),
        messages: state.messages.filter((message) => message.chat_id !== chatId)
      }));
    } catch (error) {
      set({ error: handleSupabaseError(error) });
    }
  },

  fetchMessages: async (chatId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Fetching messages for chat:', chatId);

      // Check if it's a direct chat or group chat
      const [{ data: directChat }, { data: groupChat }] = await Promise.all([
        supabase
          .from('chats')
          .select(`
            *,
            other_user:profiles!chats_doctor_id_fkey(
              full_name,
              avatar_url,
              specialty
            )
          `)
          .eq('id', chatId)
          .maybeSingle(),
        supabase
          .from('chat_groups')
          .select(`
            *,
            members:chat_group_members(
              profiles(
                id,
                full_name,
                avatar_url
              )
            )
          `)
          .eq('id', chatId)
          .maybeSingle()
      ]);

      console.log('Direct chat:', directChat);
      console.log('Group chat:', groupChat);

      const chat = directChat || groupChat;
      if (!chat) throw new Error('Chat not found');

      set({ currentChat: chat });

      // Fetch messages based on chat type
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles(
            full_name,
            avatar_url
          )
        `)
        .eq(directChat ? 'chat_id' : 'group_id', chatId)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      console.log('Fetched messages:', messages);
      set({ messages: messages || [] });

      // Mark messages as read
      await supabase.rpc('mark_messages_as_read', { 
        p_chat_id: directChat ? chatId : null,
        p_group_id: groupChat ? chatId : null
      });

      // Refresh chats to update unread counts
      await get().fetchChats();
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ error: handleSupabaseError(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (content: string) => {
    try {
      const { currentChat } = get();
      if (!currentChat) throw new Error('No active chat');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Determine if this is a direct chat or group chat
      const isDirectChat = 'user_id' in currentChat || 'other_user' in currentChat;
      const isGroupChat = 'name' in currentChat && 'members' in currentChat;
      
      // Create message with proper target ID
      const message = {
        chat_id: isDirectChat ? currentChat.id : null,
        group_id: isGroupChat ? currentChat.id : null,
        sender_id: user.id,
        content,
        type: 'text' as const,
        is_read: false
      };

      // Create an optimistic update with temporary ID and current timestamp
      const optimisticMessage = {
        ...message,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        sender: {
          full_name: user.user_metadata?.full_name || 'You',
          avatar_url: user.user_metadata?.avatar_url || null
        }
      };

      // Apply optimistic update immediately
      set(state => ({
        messages: [optimisticMessage, ...state.messages]
      }));

      // Send the actual message to the server - use single() to reduce data size
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(message)
        .select('id, created_at')
        .single();

      if (error) {
        // Revert optimistic update on error
        set(state => ({
          messages: state.messages.filter(msg => msg.id !== optimisticMessage.id),
          error: handleSupabaseError(error)
        }));
        
        throw error;
      }

      // Update the optimistic message with the real server ID and timestamp
      set(state => ({
        messages: state.messages.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...optimisticMessage, id: data.id, created_at: data.created_at } 
            : msg
        )
      }));

      // Update last message in chats without fetching the entire list
      if (currentChat) {
        set(state => ({
          chats: state.chats.map(chat => 
            chat.id === currentChat.id 
              ? { 
                  ...chat, 
                  last_message: content,
                  last_message_at: new Date().toISOString()
                } 
              : chat
          )
        }));
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      set({ error: handleSupabaseError(error) });
    }
  },

  sendMediaMessage: async (params) => {
    try {
      const { content, type, file_url, file_name, file_type } = params;
      const { currentChat } = get();
      if (!currentChat) throw new Error('No active chat');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Sending media message to chat:', currentChat.id);
      
      // Determine if this is a direct chat or group chat
      const isDirectChat = 'user_id' in currentChat || 'other_user' in currentChat;
      const isGroupChat = 'name' in currentChat && 'members' in currentChat;
      
      console.log('Chat type detection - isDirectChat:', isDirectChat, 'isGroupChat:', isGroupChat);

      // Create message with proper target ID and media info
      const message = {
        chat_id: isDirectChat ? currentChat.id : null,
        group_id: isGroupChat ? currentChat.id : null,
        sender_id: user.id,
        content,
        type,
        file_url,
        file_name,
        file_type,
        is_read: false
      };

      // Create an optimistic update with temporary ID and current timestamp
      const optimisticMessage = {
        ...message,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        sender: {
          full_name: user.user_metadata?.full_name || 'You',
          avatar_url: user.user_metadata?.avatar_url || null
        }
      };

      // Apply optimistic update immediately
      set(state => ({
        messages: [optimisticMessage, ...state.messages]
      }));

      console.log('Media message payload:', message);

      // Send the actual message to the server
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(message)
        .select(`
          *,
          sender:profiles(
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error sending media message:', error);
        
        // Revert optimistic update on error
        set(state => ({
          messages: state.messages.filter(msg => msg.id !== optimisticMessage.id),
          error: handleSupabaseError(error)
        }));
        
        throw error;
      }

      console.log('Media message sent successfully:', data);

      // Replace the optimistic message with the real one
      set(state => ({
        messages: state.messages.map(msg => 
          msg.id === optimisticMessage.id ? data : msg
        )
      }));

      // Refresh chats to update last message
      await get().fetchChats();
    } catch (error) {
      console.error('Error in sendMediaMessage:', error);
      set({ error: handleSupabaseError(error) });
    }
  },

  subscribeToMessages: (chatId: string) => {
    const { subscriptions, currentChat } = get();

    // Clean up existing subscriptions
    subscriptions.forEach(sub => sub.unsubscribe());

    console.log('Subscribing to messages for chat:', chatId);
    
    // Determine if this is a direct chat or group chat
    // Wait until currentChat is available
    let isDirectChat = false;
    let isGroupChat = false;
    
    if (currentChat) {
      isDirectChat = 'user_id' in currentChat || 'other_user' in currentChat;
      isGroupChat = 'name' in currentChat && 'members' in currentChat;
    }
    
    console.log('Subscribe type detection - isDirectChat:', isDirectChat, 'isGroupChat:', isGroupChat);

    // Create subscription for direct chat with improved performance
    const directChatSubscription = supabase
      .channel('direct_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload: any) => {
          // Adjust based on the actual payload structure
          const message = payload.new || payload.record || payload.data;
          if (!message) return;
          
          // Get the current user to check if this is our own message
          const { data } = await supabase.auth.getUser();
          const currentUser = data.user;
          
          // Skip if this message was sent by the current user (already handled by optimistic update)
          if (currentUser && message.sender_id === currentUser.id) return;
          
          // Check if message already exists to prevent duplicates
          const { messages } = get();
          const msgExists = messages.some(m => m.id === message.id);
          if (msgExists) return;
          
          // Fetch sender details with reduced fields for better performance
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', message.sender_id)
            .single();

          // Add new message to state
          set(state => ({
            messages: [{ ...message, sender }, ...state.messages]
          }));

          // Efficiently update chats list without fetching everything
          if (message.chat_id) {
            set(state => ({
              chats: state.chats.map(chat => 
                chat.id === message.chat_id
                  ? { 
                      ...chat, 
                      last_message: message.content,
                      last_message_at: message.created_at,
                      unread_count: (chat.unread_count || 0) + 1
                    } 
                  : chat
              )
            }));
          }

          // Mark message as read if we're the recipient
          if (currentUser && message.sender_id !== currentUser.id) {
            await supabase.rpc('mark_messages_as_read', { 
              p_chat_id: message.chat_id,
              p_group_id: message.group_id
            });
          }
        }
      )
      .subscribe();
      
    // Create subscription for group chat if needed
    const groupChatSubscription = isGroupChat ? supabase
      .channel('group_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${chatId}`
        },
        async (payload: any) => {
          console.log('New group message received:', payload);
          // Adjust based on the actual payload structure
          const message = payload.new || payload.record || payload.data;
          if (!message) {
            console.error('Could not extract message from payload:', payload);
            return;
          }
          
          // Get the current user to check if this is our own message
          const { data } = await supabase.auth.getUser();
          const currentUser = data.user;
          
          // Skip if this message was sent by the current user (already handled by optimistic update)
          if (currentUser && message.sender_id === currentUser.id) {
            console.log('Skipping own message from subscription');
            return;
          }
          
          // Check if message already exists to prevent duplicates
          const { messages } = get();
          const msgExists = messages.some(m => m.id === message.id);
          if (msgExists) {
            console.log('Message already exists in state, skipping');
            return;
          }
          
          // Fetch sender details
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', message.sender_id)
            .single();

          // Add new message to state
          set(state => ({
            messages: [{ ...message, sender }, ...state.messages]
          }));

          // Mark message as read if we're the recipient
          if (currentUser && message.sender_id !== currentUser.id) {
            await supabase.rpc('mark_messages_as_read', { 
              p_chat_id: message.chat_id,
              p_group_id: message.group_id
            });
          }

          // Refresh chats to update last message and unread count
          await get().fetchChats();
        }
      )
      .subscribe() : null;

    set({ 
      subscriptions: [
        { unsubscribe: () => directChatSubscription.unsubscribe() },
        ...(groupChatSubscription ? [{ unsubscribe: () => groupChatSubscription.unsubscribe() }] : [])
      ] 
    });
  },

  cleanup: () => {
    const { subscriptions } = get();
    subscriptions.forEach(sub => sub.unsubscribe());
    set({
      subscriptions: [],
      currentChat: null,
      messages: [],
    });
  },

  clearChat: async (chatId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete all messages in the chat
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('chat_id', chatId);

      if (error) throw error;

      // Update the last_message field to be null
      const { error: updateError } = await supabase
        .from('chats')
        .update({
          last_message: null,
          last_message_at: new Date().toISOString() // Keep the chat in the same position in the list
        })
        .eq('id', chatId);

      if (updateError) throw updateError;

      // Update local state
      set((state) => ({
        chats: state.chats.map((chat) => 
          chat.id === chatId 
            ? { ...chat, last_message: null } 
            : chat
        ),
        messages: state.messages.filter((message) => message.chat_id !== chatId)
      }));
      
      // If this is the current chat, clear its messages
      if (get().currentChat?.id === chatId) {
        set({ messages: [] });
      }
    } catch (error) {
      set({ error: handleSupabaseError(error) });
    }
  },
}));