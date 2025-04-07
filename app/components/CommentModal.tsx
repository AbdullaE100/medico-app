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
  Keyboard,
} from 'react-native';
import { X, Send, Image as ImageIcon, Smile } from 'lucide-react-native';
import { useFeedStore } from '@/stores/useFeedStore';
import * as Haptics from 'expo-haptics';

interface CommentModalProps {
  visible: boolean;
  postId: string | null;
  onClose: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ visible, postId, onClose }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createComment } = useFeedStore();
  const inputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    // Focus the input when the modal becomes visible
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      // Clear comment text when modal closes
      setComment('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!comment.trim() || !postId || isSubmitting) return;
    
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await createComment(postId, comment.trim());
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Text style={styles.headerTitle}>Reply</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.commentContainer}>
            <Image
              source={{ uri: 'https://placehold.co/40x40/444444/444444' }}
              style={styles.avatar}
            />
            
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="#9ca3af"
                multiline
                value={comment}
                onChangeText={setComment}
                maxLength={500}
              />
              
              <View style={styles.inputActions}>
                <View style={styles.inputButtons}>
                  <TouchableOpacity style={styles.inputButton}>
                    <ImageIcon size={20} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inputButton}>
                    <Smile size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.charCount}>
                  {comment.length}/500
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!comment.trim() || isSubmitting) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
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
  commentContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    color: '#000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  inputButtons: {
    flexDirection: 'row',
  },
  inputButton: {
    marginRight: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  submitButton: {
    backgroundColor: '#000',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
});

export default CommentModal; 