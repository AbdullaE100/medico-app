import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TextInput, 
  Pressable, 
  Alert, 
  Modal, 
  Animated, 
  Dimensions, 
  Platform,
  StatusBar,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { 
  Search, 
  Filter, 
  MapPin, 
  Building2, 
  Users, 
  ChevronRight, 
  UserPlus, 
  UserCheck, 
  Archive, 
  Bell, 
  BellOff, 
  Trash2, 
  Info, 
  MoreVertical, 
  Download, 
  XCircle,
  MessageCircle,
  Heart
} from 'lucide-react-native';
import { useChatStore } from '@/stores/useChatStore';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ConnectionRequestCard } from '@/components/ConnectionRequestCard';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ChatItem = ({ chat, onArchive, onMute, onDelete, onClear }: { 
  chat: any; 
  onArchive: () => void;
  onMute: () => void;
  onDelete: () => void;
  onClear: () => void;
}) => {
  const router = useRouter();
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);
  
  // Animation for the chat item
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;
  
  useEffect(() => {
    // Animate each chat item on mount
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  const handleExportChat = () => {
    Alert.alert('Export Chat', 'This will export your chat history');
    setOptionsModalVisible(false);
    closeSwipeable();
  };
  
  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to delete all messages in this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            onClear();
            setOptionsModalVisible(false);
            closeSwipeable();
          }
        }
      ]
    );
  };
  
  const handleDelete = () => {
    onDelete();
    setOptionsModalVisible(false);
    closeSwipeable();
  };
  
  const handleMute = () => {
    onMute();
    setOptionsModalVisible(false);
    closeSwipeable();
  };
  
  const handleViewContactInfo = () => {
    // Navigate to a different screen or show contact info in a modal
    Alert.alert('Contact Info', `${chat.other_user?.full_name}'s contact information`);
    setOptionsModalVisible(false);
    closeSwipeable();
  };

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <Pressable style={[styles.swipeAction, styles.archiveAction]} onPress={onArchive}>
        <Archive size={20} color="#FFFFFF" />
        <Text style={styles.swipeActionText}>Archive</Text>
      </Pressable>
      
      <Pressable 
        style={[styles.swipeAction, styles.moreAction]} 
        onPress={() => setOptionsModalVisible(true)}
      >
        <MoreVertical size={20} color="#FFFFFF" />
        <Text style={styles.swipeActionText}>More</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <Swipeable 
        ref={swipeableRef}
        renderRightActions={renderRightActions}
      >
        <Animated.View
          style={[
            styles.chatItemAnimatedContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.chatItem, chat.is_archived && styles.archivedChat]}
            onPress={() => router.push(`/chat/${chat.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: chat.other_user?.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400'
                }} 
                style={styles.avatar} 
              />
              {chat.other_user?.is_online && (
                <View style={styles.onlineIndicator} />
              )}
            </View>

            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{chat.other_user?.full_name}</Text>
                <View style={styles.timestampContainer}>
                  {chat.is_muted && (
                    <BellOff size={12} color="#8E8E93" style={styles.mutedIcon} />
                  )}
                  <Text style={styles.timestamp}>{chat.last_message_at}</Text>
                </View>
              </View>

              <View style={styles.chatPreview}>
                <Text numberOfLines={1} style={[
                  styles.lastMessage,
                  chat.is_muted && styles.mutedText
                ]}>
                  {chat.last_message || 'No messages yet'}
                </Text>
                {chat.unread_count > 0 && !chat.is_muted && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{chat.unread_count}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
      
      {/* Options Modal with improved styling */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={optionsModalVisible}
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={styles.optionsContainer}>
            <Pressable 
              style={styles.optionItem}
              onPress={handleMute}
            >
              {chat.is_muted ? (
                <>
                  <Bell color="#0066CC" size={22} />
                  <Text style={styles.optionText}>Unmute</Text>
                </>
              ) : (
                <>
                  <BellOff color="#0066CC" size={22} />
                  <Text style={styles.optionText}>Mute</Text>
                </>
              )}
            </Pressable>
            
            <Pressable 
              style={styles.optionItem}
              onPress={handleViewContactInfo}
            >
              <Info color="#0066CC" size={22} />
              <Text style={styles.optionText}>Contact Info</Text>
            </Pressable>
            
            <Pressable 
              style={styles.optionItem}
              onPress={handleExportChat}
            >
              <Download color="#0066CC" size={22} />
              <Text style={styles.optionText}>Export Chat</Text>
            </Pressable>
            
            <Pressable 
              style={styles.optionItem}
              onPress={handleClearChat}
            >
              <XCircle color="#FF3B30" size={22} />
              <Text style={[styles.optionText, styles.dangerText]}>Clear Chat</Text>
            </Pressable>
            
            <Pressable 
              style={styles.optionItem}
              onPress={handleDelete}
            >
              <Trash2 color="#FF3B30" size={22} />
              <Text style={[styles.optionText, styles.dangerText]}>Delete Chat</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default function ChatList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { 
    chats, 
    isLoading, 
    error,
    fetchChats,
    archiveChat,
    muteChat,
    deleteChat,
    clearChat
  } = useChatStore();

  // Function to format dates in WhatsApp style
  const formatChatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    
    // If invalid date, return empty string
    if (isNaN(date.getTime())) return '';
    
    // Check if the date is today
    if (date.toDateString() === now.toDateString()) {
      // Format as time for today's messages (e.g., "13:45")
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    
    // Check if the date is yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Check if the date is within this week
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      // Return day name (e.g., "Monday", "Tuesday")
      return date.toLocaleDateString([], { weekday: 'long' });
    }
    
    // For older dates, show date in format DD/MM/YY
    return date.toLocaleDateString([], { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    });
  };

  // Filter chats based on archived status and search query
  const filteredChats = React.useMemo(() => {
    return chats
      .filter(chat => chat.is_archived === showArchived)
      .filter(chat => {
        if (!searchQuery) return true;
        const otherUserName = chat.other_user?.full_name?.toLowerCase() || '';
        const lastMessage = chat.last_message?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return otherUserName.includes(query) || lastMessage.includes(query);
      })
      .map(chat => ({
        ...chat,
        last_message_at: formatChatDate(chat.last_message_at)
      }));
  }, [chats, showArchived, searchQuery]);

  // On component mount, fetch chats
  useEffect(() => {
    fetchChats();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchChats();
    } finally {
      setRefreshing(false);
    }
  }, [fetchChats]);

  // Animation values
  const headerHeight = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start header animation
    Animated.timing(headerHeight, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
    
    // Animate content fade in and scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Icon pulse animation
    const pulsate = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulsate.start();
    
    return () => {
      pulsate.stop();
    };
  }, []);

  const handleArchive = async (chatId: string, isArchived: boolean) => {
    try {
      await archiveChat(chatId);
    } catch (error) {
      Alert.alert('Error', 'Failed to update chat');
    }
  };
  
  const handleMute = async (chatId: string, isMuted: boolean) => {
    try {
      await muteChat(chatId);
    } catch (error) {
      Alert.alert('Error', 'Failed to update chat');
    }
  };
  
  const handleDelete = async (chatId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChat(chatId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete chat');
            }
          }
        }
      ]
    );
  };
  
  const handleClearChat = async (chatId: string) => {
    try {
      await clearChat(chatId);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear chat');
    }
  };

  const interpolatedHeaderHeight = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [70, Platform.OS === 'ios' ? 130 : 110]
  });

  if (isLoading && chats.length === 0) {
    return <LoadingOverlay message="Loading chats..." />;
  }

  // Count for archived chats
  const archivedCount = filteredChats.filter(chat => chat.is_archived).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with gradient background */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Messages</Text>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={16} color="#FFFFFF" style={styles.searchIcon} />
              <TextInput
                placeholder="Search conversations"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <Link href="/chat/new" asChild>
              <TouchableOpacity style={styles.newChatButton}>
                <MessageCircle size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </Link>
          </View>
          
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                !showArchived && styles.activeTab
              ]}
              onPress={() => setShowArchived(false)}
            >
              <Text style={[
                styles.tabText,
                !showArchived && styles.activeTabText
              ]}>Chats</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                showArchived && styles.activeTab
              ]}
              onPress={() => setShowArchived(true)}
            >
              <Text style={[
                styles.tabText,
                showArchived && styles.activeTabText
              ]}>Archived</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
      
      {error && (
        <ErrorMessage 
          message={error}
          onDismiss={() => useChatStore.setState({ error: null })}
        />
      )}
      
      {isLoading && chats.length === 0 ? (
        <LoadingOverlay message="Loading conversations..." />
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MessageCircle size={40} color="#0066CC" />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery 
              ? 'Try different search terms'
              : showArchived 
                ? 'No archived conversations'
                : 'Start a conversation with a colleague'
            }
          </Text>
          {!searchQuery && !showArchived && (
            <Link href="/chat/new" asChild>
              <TouchableOpacity style={styles.emptyActionButton}>
                <Text style={styles.emptyActionButtonText}>Start a new chat</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item: chat }) => (
            <ChatItem 
              chat={chat}
              onArchive={() => handleArchive(chat.id, chat.is_archived)}
              onMute={() => handleMute(chat.id, chat.is_muted)}
              onDelete={() => handleDelete(chat.id)}
              onClear={() => handleClearChat(chat.id)}
            />
          )}
          contentContainerStyle={styles.chatList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#0066CC"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 22,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activeTabText: {
    color: '#0066CC',
  },
  chatList: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  chatItemAnimatedContainer: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderLeftWidth: 0,
    borderLeftColor: '#0066CC',
  },
  archivedChat: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#94A3B8',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(0, 102, 204, 0.1)',
  },
  onlineIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    bottom: 0,
    right: 0,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1E293B',
    flex: 1,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutedIcon: {
    marginRight: 4,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    flex: 1,
    paddingRight: 8,
  },
  mutedText: {
    color: '#94A3B8',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 160,
    marginVertical: 5,
  },
  swipeAction: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveAction: {
    backgroundColor: '#64748B',
  },
  moreAction: {
    backgroundColor: '#0066CC',
  },
  swipeActionText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#1E293B',
    marginLeft: 16,
  },
  dangerText: {
    color: '#FF3B30',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});