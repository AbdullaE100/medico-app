import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, ActionSheetIOS, Alert, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ImageIcon, File, Send, Paperclip, X, ArrowLeft, Info, User, MessageCircle } from 'lucide-react-native';
import { useChatStore } from '@/stores/useChatStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';

// Custom base64 to ArrayBuffer conversion since we're having issues with the package
const base64ToArrayBuffer = (base64: string) => {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

// Custom atob polyfill for React Native
function atob(data: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let position = 0;
  let idx = 0;
  let chr1, chr2, chr3;
  let enc1, enc2, enc3, enc4;

  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  data = data.replace(/[^A-Za-z0-9\+\/\=]/g, '');

  while (position < data.length) {
    enc1 = chars.indexOf(data.charAt(position++));
    enc2 = chars.indexOf(data.charAt(position++));
    enc3 = chars.indexOf(data.charAt(position++));
    enc4 = chars.indexOf(data.charAt(position++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  }

  return output;
}

const MessageBubble = ({ message, isCurrentUser }: { 
  message: any; 
  isCurrentUser: boolean;
}) => (
  <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
    {!isCurrentUser && (
      <Image 
        source={{ uri: message.sender?.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400' }} 
        style={styles.messageBubbleAvatar} 
      />
    )}
    <View style={[styles.messageContent, isCurrentUser ? styles.currentUserContent : styles.otherUserContent]}>
      {!isCurrentUser && (
        <Text style={styles.senderName}>{message.sender?.full_name}</Text>
      )}
      {message.type === 'image' && message.file_url && (
        <Image source={{ uri: message.file_url }} style={styles.attachmentImage} />
      )}
      {message.type === 'file' && message.file_url && (
        <View style={styles.documentAttachment}>
          <File size={22} color="#0066CC" />
          <Text style={styles.documentName}>{message.file_name}</Text>
        </View>
      )}
      <Text style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
        {message.content}
      </Text>
      <Text style={styles.messageTime}>
        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  </View>
);

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    type: 'image' | 'file';
    uri: string;
    name?: string;
    base64?: string;
    mimeType?: string;
  } | null>(null);
  const sendingRef = useRef(false);
  const { 
    messages, 
    currentChat,
    isLoading, 
    error,
    fetchMessages,
    sendMessage,
    sendMediaMessage,
    subscribeToMessages,
    cleanup
  } = useChatStore();

  const scrollViewRef = useRef<FlatList>(null);

  useEffect(() => {
    // Get current user ID
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    
    getCurrentUser();
    
    // Fetch initial messages
    fetchMessages(id as string);
    
    // Subscribe to new messages
    subscribeToMessages(id as string);

    // Cleanup on unmount
    return () => cleanup();
  }, [id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleAttachmentPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Document'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImage();
          } else if (buttonIndex === 3) {
            pickDocument();
          }
        }
      );
    } else {
      // For Android, show a regular alert with options
      Alert.alert(
        'Attach Media',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: pickImage },
          { text: 'Document', onPress: pickDocument },
        ]
      );
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedMedia({
        type: 'image',
        uri: asset.uri,
        base64: asset.base64,
        mimeType: getMimeType(asset.uri),
      });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Media library permission is needed to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedMedia({
        type: 'image',
        uri: asset.uri,
        base64: asset.base64,
        mimeType: getMimeType(asset.uri),
      });
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedMedia({
          type: 'file',
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const getMimeType = (uri: string) => {
    const extension = uri.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'heic':
        return 'image/heic';
      default:
        return 'application/octet-stream';
    }
  };

  const cancelSelectedMedia = () => {
    setSelectedMedia(null);
  };

  const handleSend = async () => {
    if (isSending || sendingRef.current) return;
    
    sendingRef.current = true;
    setIsSending(true);
    
    try {
      if (selectedMedia) {
        const message = newMessage.trim();
        
        if (selectedMedia.type === 'image') {
          if (!selectedMedia.base64) {
            throw new Error('No base64 data available for the image');
          }
          
          const fileName = `chat-${Date.now()}.${selectedMedia.mimeType?.split('/')[1] || 'jpg'}`;
          
          const { data, error } = await supabase.storage
            .from('chat_media')
            .upload(fileName, base64ToArrayBuffer(selectedMedia.base64), {
              contentType: selectedMedia.mimeType || 'image/jpeg',
              cacheControl: '3600'
            });
            
          if (error) throw error;
          
          const { data: publicUrl } = supabase.storage
            .from('chat_media')
            .getPublicUrl(fileName);
            
          await sendMediaMessage({
            content: message,
            type: 'image',
            file_url: publicUrl.publicUrl,
            file_name: fileName,
            file_type: selectedMedia.mimeType || 'image/jpeg',
          });
        } else if (selectedMedia.type === 'file') {
          const response = await fetch(selectedMedia.uri);
          const blob = await response.blob();
          
          const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) {
                resolve(reader.result as ArrayBuffer);
              } else {
                reject(new Error('Could not read file data'));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(blob);
          });
          
          const fileName = selectedMedia.name || `document-${Date.now()}`;
          const { data, error } = await supabase.storage
            .from('chat_media')
            .upload(fileName, new Uint8Array(arrayBuffer), {
              contentType: selectedMedia.mimeType || 'application/octet-stream',
              cacheControl: '3600'
            });
            
          if (error) throw error;
          
          const { data: publicUrl } = supabase.storage
            .from('chat_media')
            .getPublicUrl(fileName);
            
          await sendMediaMessage({
            content: message,
            type: 'file',
            file_url: publicUrl.publicUrl,
            file_name: fileName,
            file_type: selectedMedia.mimeType || 'application/octet-stream',
          });
        }
        
        setNewMessage('');
        setSelectedMedia(null);
      } else if (newMessage.trim()) {
        const messageText = newMessage.trim();
        setNewMessage('');
        await sendMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      setTimeout(() => {
        sendingRef.current = false;
      }, 300);
    }
  };

  if (isLoading && messages.length === 0) {
    return <LoadingOverlay message="Loading conversation..." />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Enhanced Header with Avatar */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#0066CC', '#0091FF']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerProfile}>
              {currentChat?.other_user?.avatar_url ? (
                <Image 
                  source={{ uri: currentChat.other_user.avatar_url }} 
                  style={styles.headerAvatar} 
                />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <User size={18} color="#FFFFFF" />
                </View>
              )}
              
              <View style={styles.headerText}>
                <Text style={styles.headerName}>
                  {currentChat?.other_user?.full_name || 'Chat'}
                </Text>
                <Text style={styles.headerStatus}>
                  {currentChat?.other_user?.is_online ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.headerButton}>
              <Info size={22} color="#FFFFFF" />
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
      
      {isLoading && messages.length === 0 ? (
        <LoadingOverlay message="Loading conversation..." />
      ) : (
        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <MessageBubble 
              message={item} 
              isCurrentUser={item.sender_id === currentUserId}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyConversation}>
              <View style={styles.emptyIconContainer}>
                <MessageCircle size={32} color="#0066CC" />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Send your first message below</Text>
            </View>
          }
        />
      )}
      
      {/* Media Preview */}
      {selectedMedia && (
        <View style={styles.mediaPreviewContainer}>
          <View style={styles.mediaPreview}>
            {selectedMedia.type === 'image' ? (
              <Image source={{ uri: selectedMedia.uri }} style={styles.mediaPreviewImage} />
            ) : (
              <View style={styles.filePreview}>
                <File size={22} color="#0066CC" />
                <Text style={styles.filePreviewName} numberOfLines={1}>
                  {selectedMedia.name || 'File'}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.mediaPreviewCancel}
              onPress={cancelSelectedMedia}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Enhanced Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachmentButton}
          onPress={handleAttachmentPress}
        >
          <Paperclip size={20} color="#0066CC" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#94A3B8"
          multiline
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!newMessage.trim() && !selectedMedia) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={(!newMessage.trim() && !selectedMedia) || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerText: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  headerStatus: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    marginVertical: 4,
    maxWidth: '85%',
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
    marginLeft: 40,
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
    marginRight: 40,
  },
  messageBubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 102, 204, 0.1)',
  },
  messageContent: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentUserContent: {
    backgroundColor: '#0066CC',
    borderBottomRightRadius: 4,
  },
  otherUserContent: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#0066CC',
    marginBottom: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 6,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.06)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  documentName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 8,
    flex: 1,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#1E293B',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  emptyConversation: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    padding: 20,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  mediaPreviewContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  mediaPreview: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: 6,
    padding: 10,
    paddingRight: 16,
  },
  filePreviewName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginLeft: 8,
    maxWidth: 240,
  },
  mediaPreviewCancel: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  attachmentButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1E293B',
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
});