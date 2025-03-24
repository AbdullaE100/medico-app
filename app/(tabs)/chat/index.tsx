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
  TouchableOpacity
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
      
      {/* WhatsApp-style Options Modal */}
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
                  <Bell color="#007AFF" size={24} />
                  <Text style={styles.optionText}>Unmute</Text>
                </>
              ) : (
                <>
                  <BellOff color="#007AFF" size={24} />
                  <Text style={styles.optionText}>Mute</Text>
                </>
              )}
            </Pressable>
            
            <Pressable 
              style={styles.optionItem}
              onPress={handleViewContactInfo}
            >
              <Info color="#007AFF" size={24} />
              <Text style={styles.optionText}>Contact Info</Text>
            </Pressable>
            
            <Pressable 
              style={styles.optionItem}
              onPress={handleExportChat}
            >
              <Download color="#007AFF" size={24} />
              <Text style={styles.optionText}>Export Chat</Text>
            </Pressable>
            
            <Pressable 
              style={styles.optionItem}
              onPress={handleClearChat}
            >
              <XCircle color="#007AFF" size={24} />
              <Text style={styles.optionText}>Clear Chat</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.optionItem, styles.deleteOption]}
              onPress={handleDelete}
            >
              <Trash2 color="#FF3B30" size={24} />
              <Text style={[styles.optionText, styles.deleteText]}>Delete Chat</Text>
            </Pressable>
            
            <Pressable 
              style={styles.cancelButton}
              onPress={() => setOptionsModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default function ChatList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showHeaderOptions, setShowHeaderOptions] = useState(false);
  const { 
    chats,
    isLoading, 
    error,
    fetchChats,
    archiveChat,
    unarchiveChat,
    muteChat,
    unmuteChat,
    deleteChat,
    clearChat
  } = useChatStore();
  const router = useRouter();

  // Animation values
  const headerHeight = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchChats();
  }, []);

  // Start animations
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
      if (isArchived) {
        await unarchiveChat(chatId);
      } else {
        await archiveChat(chatId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to archive chat');
    }
  };

  const handleMute = async (chatId: string, isMuted: boolean) => {
    try {
      if (isMuted) {
        await unmuteChat(chatId);
      } else {
        await muteChat(chatId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mute chat');
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
        },
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

  const interpolatedHeaderHeight = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [70, Platform.OS === 'ios' ? 130 : 110]
  });

  if (isLoading && chats.length === 0) {
    return <LoadingOverlay message="Loading chats..." />;
  }

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const name = chat.other_user?.full_name?.toLowerCase() || '';
    const lastMessage = (chat.last_message || '').toLowerCase();
    
    return name.includes(query) || lastMessage.includes(query);
  });

  // Separate active and archived chats
  const activeChats = filteredChats.filter(chat => !chat.is_archived);
  const archivedChats = filteredChats.filter(chat => chat.is_archived);

  // Count for archived chats
  const archivedCount = archivedChats.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#062454', '#0066CC']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeLine} />
      </View>
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.animatedHeader,
          { height: interpolatedHeaderHeight }
        ]}
      >
        <View style={styles.logoContainer}>
          <Animated.View 
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <MessageCircle size={22} color="#fff" />
          </Animated.View>
          <Text style={styles.headerTitle}>
            {showArchived ? "Archived Chats" : "Messages"}
          </Text>
        </View>
        
        <Animated.View 
          style={[
            styles.searchBarContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }]
            }
          ]}
        >
          <View style={styles.searchBar}>
            <Search size={18} color="#fff" style={styles.searchIcon} />
            <TextInput
              placeholder={showArchived ? "Search archived chats" : "Search messages"}
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {!showArchived && (
            <TouchableOpacity 
              style={styles.newChatButton}
              onPress={() => setShowHeaderOptions(true)}
            >
              <Users size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showHeaderOptions}
        onRequestClose={() => setShowHeaderOptions(false)}
      >
        <Pressable 
          style={styles.optionsOverlay}
          onPress={() => setShowHeaderOptions(false)}
        >
          <View style={styles.headerOptionsContainer}>
            <Link href="/chat/new" asChild>
              <Pressable 
                style={styles.headerOption}
                onPress={() => setShowHeaderOptions(false)}
              >
                <UserPlus size={20} color="#007AFF" />
                <Text style={styles.headerOptionText}>New Chat</Text>
              </Pressable>
            </Link>
            
            <Link href="/chat/new-group" asChild>
              <Pressable 
                style={styles.headerOption}
                onPress={() => setShowHeaderOptions(false)}
              >
                <Users size={20} color="#007AFF" />
                <Text style={styles.headerOptionText}>New Group</Text>
              </Pressable>
            </Link>
          </View>
        </Pressable>
      </Modal>

      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => useChatStore.setState({ error: null })}
        />
      )}

      <Animated.View 
        style={[
          styles.contentContainer,
          { 
            opacity: fadeAnim,
            transform: [{ translateY }] 
          }
        ]}
      >
        {/* Show only active chats in normal view, or only archived chats in archive view */}
        <FlatList
          data={showArchived ? archivedChats : activeChats}
          renderItem={({ item }) => (
            <ChatItem 
              chat={{
                ...item,
                last_message_at: formatChatDate(item.last_message_at)
              }}
              onArchive={() => handleArchive(item.id, item.is_archived)}
              onMute={() => handleMute(item.id, item.is_muted)}
              onDelete={() => handleDelete(item.id)}
              onClear={() => handleClearChat(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            !showArchived && archivedCount > 0 ? (
              <TouchableOpacity 
                style={styles.archivedSection}
                onPress={() => setShowArchived(true)}
              >
                <Archive size={20} color="#0066CC" />
                <Text style={styles.archivedText}>Archived</Text>
                <View style={styles.archivedCount}>
                  <Text style={styles.archivedCountText}>{archivedCount}</Text>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {showArchived ? "No archived chats" : "No messages yet"}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {showArchived ? 
                  "Archived chats will appear here" : 
                  "Start a conversation with a doctor"
                }
              </Text>
            </View>
          }
        />
      </Animated.View>
      
      {showArchived && (
        <TouchableOpacity 
          style={styles.closeArchivedButton}
          onPress={() => setShowArchived(false)}
        >
          <Text style={styles.closeArchivedText}>Back to Chats</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#F2F2F7',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  chatList: {
    paddingBottom: 16,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  archivedChat: {
    backgroundColor: '#F9F9F9',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E5E5',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#8E8E93',
  },
  mutedIcon: {
    marginRight: 4,
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#8E8E93',
  },
  mutedText: {
    color: '#AEAEB2',
  },
  unreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 5,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 10,
    paddingBottom: 30, // Extra padding at bottom for iOS home indicator
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    marginLeft: 15,
  },
  deleteOption: {
    borderTopWidth: 8,
    borderTopColor: '#F2F2F2',
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#FF3B30',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 16,
    backgroundColor: '#F7F7F7',
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#007AFF',
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C8C7CC',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#8E8E93',
  },
  archivedSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  archivedText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  archivedCount: {
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  archivedCountText: {
    color: '#8E8E93',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  closeArchivedButton: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },
  closeArchivedText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#007AFF',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: '100%',
    gap: 4,
    paddingHorizontal: 8,
  },
  archiveAction: {
    backgroundColor: '#007AFF',
  },
  moreAction: {
    backgroundColor: '#8E8E93',
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  headerOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 10,
    paddingBottom: 30, // Extra padding at bottom for iOS home indicator
  },
  headerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  headerOptionText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    marginLeft: 15,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 180 : 160,
    zIndex: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -120,
    right: -100,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 80,
    left: -80,
  },
  decorativeLine: {
    position: 'absolute',
    width: 120,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: 40,
    right: 40,
    transform: [{ rotate: '30deg' }],
  },
  animatedHeader: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4e87cb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 10,
  },
  contentContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 140 : 120,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1,
  },
  chatItemAnimatedContainer: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E5E5',
    borderWidth: 2,
    borderColor: 'rgba(0, 102, 204, 0.2)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  mutedIcon: {
    marginRight: 4,
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  mutedText: {
    color: '#94a3b8',
  },
  unreadBadge: {
    backgroundColor: '#0066CC',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 5,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 40,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 30, // Extra padding at bottom for iOS home indicator
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 102, 204, 0.1)',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1e293b',
    marginLeft: 15,
  },
  deleteOption: {
    borderTopWidth: 8,
    borderTopColor: '#F2F2F2',
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#FF3B30',
  },
  cancelButton: {
    marginTop: 8,
    marginBottom: 10,
    paddingVertical: 16,
    backgroundColor: '#F7F7F7',
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#0066CC',
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C8C7CC',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#8E8E93',
  },
  archivedSection: {
    margin: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.05)',
  },
  archivedText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#1e293b',
    marginLeft: 12,
  },
  archivedCount: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  archivedCountText: {
    color: '#0066CC',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  closeArchivedButton: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },
  closeArchivedText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: '100%',
    gap: 4,
    paddingHorizontal: 8,
  },
  archiveAction: {
    backgroundColor: '#0066CC',
  },
  moreAction: {
    backgroundColor: '#64748b',
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  headerOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 30, // Extra padding at bottom for iOS home indicator
  },
  headerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 102, 204, 0.1)',
  },
  headerOptionText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1e293b',
    marginLeft: 15,
  },
});