import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { X, Repeat2 } from 'lucide-react-native';
import { useFeedStore, Post } from '@/stores/useFeedStore';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';

interface RepostModalProps {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
}

const RepostModal: React.FC<RepostModalProps> = ({ visible, post, onClose }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { repostPost } = useFeedStore();
  const inputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    // Focus the input when the modal becomes visible
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      // Clear text when modal closes
      setContent('');
    }
  }, [visible]);

  const handleRepost = async (withQuote: boolean) => {
    if (!post?.id || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await repostPost(post.id, withQuote ? content.trim() : undefined);
      setContent('');
      onClose();
    } catch (error: any) {
      console.error('Error reposting:', error);
      
      // Handle specific error codes
      if (error?.code === 'PGRST201') {
        setError('You have already reposted this post. Please try with a different post.');
      } else if (error?.message?.includes('not authenticated')) {
        setError('You must be logged in to repost.');
      } else {
        setError(error?.message || 'Failed to repost. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format timestamp
  const formattedTime = post?.created_at 
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: false }).replace('about ', '')
    : 'recently';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Quote Post</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.divider} />
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.repostContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Add your thoughts to this post"
              placeholderTextColor="#9ca3af"
              multiline
              value={content}
              onChangeText={setContent}
              maxLength={280}
            />
            
            {post && (
              <>
                <Text style={styles.quoteHint}>The post below will appear in your quote:</Text>
                <View style={styles.originalPost}>
                  <View style={styles.originalHeader}>
                    <Image 
                      source={{ 
                        uri: post.profile?.avatar_url || 'https://placehold.co/40x40/444444/444444'
                      }} 
                      style={styles.avatar} 
                    />
                    <View style={styles.postMetadata}>
                      <Text style={styles.authorName}>
                        {post.profile?.full_name || 'Medical Professional'}
                      </Text>
                      <Text style={styles.timestamp}>{formattedTime}</Text>
                    </View>
                  </View>
                  <Text style={styles.postContent}>{post.content}</Text>
                </View>
              </>
            )}
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.charCount}>{content.length}/280</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.repostButton, isSubmitting && styles.disabledButton]}
                onPress={() => handleRepost(false)}
                disabled={isSubmitting}
              >
                <Repeat2 size={16} color="#fff" />
                <Text style={styles.repostButtonText}>Repost</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.quoteButton,
                  (!content.trim() || isSubmitting) && styles.disabledButton
                ]}
                onPress={() => handleRepost(true)}
                disabled={!content.trim() || isSubmitting}
              >
                <Text style={styles.quoteButtonText}>Quote</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {isSubmitting && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#000" />
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  placeholder: {
    width: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  repostContainer: {
    padding: 16,
    flex: 1,
  },
  input: {
    fontSize: 16,
    color: '#000',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  originalPost: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  originalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  postMetadata: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  postContent: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  repostButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  repostButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  quoteButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  quoteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  quoteHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
});

export default RepostModal; 