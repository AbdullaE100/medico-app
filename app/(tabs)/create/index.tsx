import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Image as ImageIcon,
  Camera,
  Hash,
  X,
  ArrowLeft,
  Globe,
  Users,
  Plus,
  Smile,
  MapPin,
  AtSign,
  Tag
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useFeedStore } from '@/stores/useFeedStore';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const MAX_IMAGES = 4;
const MAX_HASHTAGS = 5;
const CHAR_LIMIT = 500;

export default function CreatePostScreen() {
  const router = useRouter();
  const { createPost } = useFeedStore();
  
  // State
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [textHeight, setTextHeight] = useState(120);
  const [mentionText, setMentionText] = useState('');
  const [mentionData, setMentionData] = useState<any[]>([]);
  const [showMentionPanel, setShowMentionPanel] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const textInputRef = useRef<TextInput>(null);
  
  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  
  // Animation effect
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Handle content change with hashtag parsing
  const handleContentChange = (text: string) => {
    setContent(text);
    
    // Check for mentions
    const matches = text.match(/@\w+/g);
    if (matches && matches.length > 0) {
      const lastMention = matches[matches.length - 1];
      setMentionText(lastMention.substring(1));
      searchMentions(lastMention.substring(1));
    } else {
      setShowMentionPanel(false);
    }
  };
  
  // Search for mentions
  const searchMentions = async (query: string) => {
    if (query.length < 2) {
      setShowMentionPanel(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${query}%`)
        .limit(5);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setMentionData(data);
        setShowMentionPanel(true);
      } else {
        setShowMentionPanel(false);
      }
    } catch (error) {
      console.error('Error searching mentions:', error);
      setShowMentionPanel(false);
    }
  };
  
  // Select a mention
  const selectMention = (profile: any) => {
    const beforeMention = content.substring(0, content.lastIndexOf('@'));
    const afterMention = content.substring(content.lastIndexOf('@') + mentionText.length + 1);
    const newContent = `${beforeMention}@${profile.full_name} ${afterMention}`;
    setContent(newContent);
    setShowMentionPanel(false);
    
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Handle hashtag input
  const handleHashtagChange = (text: string) => {
    // Remove # prefix and spaces
    const cleanText = text.replace(/^#/, '').trim();
    setCurrentHashtag(cleanText);
  };
  
  // Add a hashtag
  const addHashtag = () => {
    if (
      currentHashtag.trim() !== '' && 
      !hashtags.includes(currentHashtag.toLowerCase()) && 
      hashtags.length < MAX_HASHTAGS
    ) {
      setHashtags([...hashtags, currentHashtag.toLowerCase()]);
      setCurrentHashtag('');
      
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Remove a hashtag
  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
    
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  // Pick image from library
  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images.`);
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0].uri]);
        
        // Trigger haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'There was a problem selecting your image. Please try again.');
    }
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  // Validate post content
  const validatePost = (): boolean => {
    if (content.trim() === '') {
      return false;
    }
    
    if (content.length > CHAR_LIMIT) {
      return false;
    }
    
    return true;
  };
  
  // Handle post submission
  const handlePostSubmit = async () => {
    if (!validatePost()) {
      Alert.alert('Invalid Post', content.trim() === '' 
        ? 'Please write something before posting.' 
        : `Your post exceeds the ${CHAR_LIMIT} character limit.`);
      return;
    }
    
    console.log('Post button clicked - starting post creation process');
    setIsPosting(true);
    
    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      // Upload images if any
      const uploadedImageUrls: string[] = [];
      
      if (images.length > 0) {
        console.log(`Uploading ${images.length} images`);
        for (const imageUri of images) {
          const fileName = `${uuidv4()}.jpg`;
          
          // Convert uri to blob
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          console.log(`Uploading image: ${fileName}`);
          
          // Upload to Supabase Storage
          const { error } = await supabase.storage
            .from('post-images')
            .upload(fileName, blob);
            
          if (error) {
            console.error('Image upload error:', error);
            throw error;
          }
          
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('post-images')
            .getPublicUrl(fileName);
            
          if (publicUrlData.publicUrl) {
            uploadedImageUrls.push(publicUrlData.publicUrl);
            console.log(`Image uploaded successfully: ${publicUrlData.publicUrl}`);
          }
        }
      }
      
      console.log('Creating post with content:', content.substring(0, 50) + (content.length > 50 ? '...' : ''));
      console.log('Using hashtags:', hashtags);
      
      // Create post - remove visibility field as it doesn't exist in the database
      await createPost({
        content,
        media_url: uploadedImageUrls,
        hashtags,
        // Remove visibility field as it doesn't exist in the database schema
      });
      
      console.log('Post created successfully');
      
      // Reset form fields
      setContent('');
      setImages([]);
      setHashtags([]);
      setIsPublic(true);
      
      // Success - navigate back home
      console.log('Navigating to home screen');
      
      // Use a small timeout to ensure store updates are processed
      setTimeout(() => {
        router.replace('/home');
      }, 100);
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      // Show more detailed error information
      let errorMessage = 'There was a problem creating your post.';
      if (error.message) {
        errorMessage += ' ' + error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsPosting(false);
    }
  };
  
  // Cancel post creation
  const handleCancel = () => {
    if (content.trim() !== '' || images.length > 0 || hashtags.length > 0) {
      Alert.alert(
        'Discard Post?',
        'Are you sure you want to discard this post? Your draft will be lost.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Animated.View 
          style={[
            styles.header,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleCancel}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Create Post</Text>
          
          <TouchableOpacity
            style={[
              styles.postButton,
              { opacity: validatePost() ? 1 : 0.5 }
            ]}
            onPress={handlePostSubmit}
            disabled={isPosting || !validatePost()}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      
        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.contentContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <View style={styles.privacySelector}>
              <TouchableOpacity
                style={[
                  styles.privacyOption,
                  isPublic && styles.privacyOptionSelected
                ]}
                onPress={() => setIsPublic(true)}
              >
                <Globe size={16} color={isPublic ? '#0066CC' : '#666'} />
                <Text 
                  style={[
                    styles.privacyText,
                    isPublic && styles.privacyTextSelected
                  ]}
                >
                  Public
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.privacyOption,
                  !isPublic && styles.privacyOptionSelected
                ]}
                onPress={() => setIsPublic(false)}
              >
                <Users size={16} color={!isPublic ? '#0066CC' : '#666'} />
                <Text 
                  style={[
                    styles.privacyText,
                    !isPublic && styles.privacyTextSelected
                  ]}
                >
                  Followers
                </Text>
              </TouchableOpacity>
            </View>
          
            <View style={styles.textInputContainer}>
              <TextInput
                ref={textInputRef}
                style={[
                  styles.contentInput,
                  { height: Math.max(120, textHeight) }
                ]}
                placeholder="What's on your mind? Share medical insights or ask questions..."
                placeholderTextColor="#999"
                multiline
                value={content}
                onChangeText={handleContentChange}
                onContentSizeChange={(e) => setTextHeight(e.nativeEvent.contentSize.height)}
                onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
                autoFocus
                maxLength={CHAR_LIMIT + 50} // Give a little buffer before hard cutoff
              />
              
              <Text style={styles.charCounter}>
                {content.length}/{CHAR_LIMIT}
              </Text>
            </View>
            
            {showMentionPanel && (
              <View style={styles.mentionContainer}>
                {mentionData.map((profile) => (
                  <TouchableOpacity
                    key={profile.id}
                    style={styles.mentionItem}
                    onPress={() => selectMention(profile)}
                  >
                    {profile.avatar_url ? (
                      <Image 
                        source={{ uri: profile.avatar_url }} 
                        style={styles.mentionAvatar} 
                      />
                    ) : (
                      <View style={styles.mentionAvatarPlaceholder}>
                        <AtSign size={14} color="#666" />
                      </View>
                    )}
                    <Text style={styles.mentionName}>{profile.full_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {images.length > 0 && (
              <ScrollView 
                horizontal 
                style={styles.imagePreviewScroll}
                showsHorizontalScrollIndicator={false}
              >
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <X size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            
            <View style={styles.hashtagSection}>
              <View style={styles.hashtagInputContainer}>
                <Hash size={18} color="#0066CC" />
                <TextInput
                  style={styles.hashtagInput}
                  placeholder="Add hashtags (max 5)"
                  placeholderTextColor="#999"
                  value={currentHashtag}
                  onChangeText={handleHashtagChange}
                  onSubmitEditing={addHashtag}
                  maxLength={20}
                />
                <TouchableOpacity 
                  style={[
                    styles.addHashtagButton,
                    { opacity: currentHashtag.trim() !== '' ? 1 : 0.5 }
                  ]}
                  onPress={addHashtag}
                  disabled={currentHashtag.trim() === ''}
                >
                  <Plus size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              {hashtags.length > 0 && (
                <View style={styles.hashtagChipsContainer}>
                  {hashtags.map((tag) => (
                    <View key={tag} style={styles.hashtagChip}>
                      <Text style={styles.hashtagChipText}>#{tag}</Text>
                      <TouchableOpacity
                        style={styles.removeHashtagButton}
                        onPress={() => removeHashtag(tag)}
                      >
                        <X size={12} color="#0066CC" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
        
        <Animated.View 
          style={[
            styles.toolbar,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: -slideAnim }] 
            }
          ]}
        >
          <TouchableOpacity style={styles.toolbarButton} onPress={pickImage}>
            <ImageIcon size={22} color="#0066CC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton}>
            <Camera size={22} color="#0066CC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton}>
            <Smile size={22} color="#0066CC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton}>
            <MapPin size={22} color="#0066CC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton}>
            <Tag size={22} color="#0066CC" />
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  postButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  privacySelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    padding: 4,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
  },
  privacyOptionSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  privacyText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#666',
  },
  privacyTextSelected: {
    color: '#0066CC',
  },
  textInputContainer: {
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 120,
    paddingBottom: 30, // Space for the character counter
  },
  charCounter: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#999',
  },
  imagePreviewScroll: {
    marginBottom: 16,
  },
  imagePreviewContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashtagSection: {
    marginBottom: 16,
  },
  hashtagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  hashtagInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  addHashtagButton: {
    backgroundColor: '#0066CC',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashtagChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  hashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  hashtagChipText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0066CC',
    marginRight: 6,
  },
  removeHashtagButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  toolbarButton: {
    padding: 12,
    borderRadius: 20,
  },
  mentionContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  mentionAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  mentionAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mentionName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#333',
  },
}); 