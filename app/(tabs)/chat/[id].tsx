import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, ActionSheetIOS, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image as ImageIcon, File, Send, Paperclip, X } from 'lucide-react-native';
import { useChatStore } from '@/stores/useChatStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

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
          <File size={24} color="#0066CC" />
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
    return <LoadingOverlay message="Loading messages..." />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => useChatStore.setState({ error: null })}
        />
      )}

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image
            source={{ 
              uri: currentChat?.other_user?.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400'
            }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {currentChat?.other_user?.full_name || 'Loading...'}
            </Text>
            <Text style={styles.headerSpecialty}>
              {currentChat?.other_user?.specialty || 'Doctor'}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble 
            message={item} 
            isCurrentUser={item.sender_id === currentUserId}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        inverted
      />

      {selectedMedia && (
        <View style={styles.selectedMediaContainer}>
          {selectedMedia.type === 'image' ? (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedMedia.uri }} style={styles.selectedImage} />
              <Pressable style={styles.cancelButton} onPress={cancelSelectedMedia}>
                <X size={18} color="#FFF" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.selectedFileContainer}>
              <File size={24} color="#0066CC" />
              <Text style={styles.selectedFileName} numberOfLines={1} ellipsizeMode="middle">
                {selectedMedia.name || 'Document'}
              </Text>
              <Pressable style={styles.cancelButton} onPress={cancelSelectedMedia}>
                <X size={18} color="#FFF" />
              </Pressable>
            </View>
          )}
        </View>
      )}

      <View style={styles.inputContainer}>
        <Pressable style={styles.attachButton} onPress={handleAttachmentPress}>
          <Paperclip size={24} color="#666666" />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          placeholderTextColor="#666666"
          onSubmitEditing={handleSend}
        />
        <Pressable 
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
            <Send size={20} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  headerSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
  },
  messageList: {
    padding: 16,
    gap: 16,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
  },
  messageBubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    borderRadius: 16,
    padding: 12,
  },
  currentUserContent: {
    backgroundColor: '#0066CC',
  },
  otherUserContent: {
    backgroundColor: '#F0F2F5',
  },
  senderName: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#666666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#1A1A1A',
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#999999',
    alignSelf: 'flex-end',
  },
  attachment: {
    marginBottom: 8,
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    padding: 8,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  documentName: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  document: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  selectedMediaContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    height: 120,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    gap: 8,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  cancelButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});