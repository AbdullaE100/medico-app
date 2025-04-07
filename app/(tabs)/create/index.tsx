import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Image,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Camera, 
  Smile, 
  MapPin, 
  Tag, 
  Hash, 
  AtSign, 
  X, 
  Users, 
  Globe, 
  Plus,
  UserX
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFeedStore } from '@/stores/useFeedStore';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  Easing 
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Constants
const CHAR_LIMIT = 500;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CreatePostScreen() {
  const router = useRouter();
  const { createPost } = useFeedStore();
  
  // State
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [textHeight, setTextHeight] = useState(120);
  const [mentionText, setMentionText] = useState('');
  const [mentionData, setMentionData] = useState<any[]>([]);
  const [showMentionPanel, setShowMentionPanel] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Animated values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);
  const scaleAnim = useSharedValue(0.95);
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
    fadeAnim.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    slideAnim.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 120 });
  }, []);
  
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{ translateY: slideAnim.value }]
    };
  });
  
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{ translateY: slideAnim.value }, { scale: scaleAnim.value }]
    };
  });
  
  const toolbarAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{ translateY: slideAnim.value * -0.5 }]
    };
  });

  // Handle content changes and mention detection
  const handleContentChange = (text: string) => {
    setContent(text);
    
    // Check for mention pattern
    const lastAtSymbolIndex = text.lastIndexOf('@');
    if (lastAtSymbolIndex >= 0 && lastAtSymbolIndex < cursorPosition) {
      const query = text.substring(lastAtSymbolIndex + 1, cursorPosition).trim();
      if (query) {
        setMentionText(query);
        searchMentions(query);
        setShowMentionPanel(true);
      } else {
        setShowMentionPanel(false);
      }
    } else {
      setShowMentionPanel(false);
    }
  };
  
  // Search for user mentions
  const searchMentions = async (query: string) => {
    if (query.length < 2) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${query}%`)
        .limit(5);
      
      if (error) throw error;
      
      setMentionData(data || []);
    } catch (error) {
      console.error('Error searching mentions:', error);
      setMentionData([]);
    }
  };
  
  // Handle mention selection
  const selectMention = (profile: any) => {
    const textBefore = content.substring(0, content.lastIndexOf('@'));
    const textAfter = content.substring(cursorPosition);
    const newText = `${textBefore}@${profile.full_name} ${textAfter}`;
    
    setContent(newText);
    setShowMentionPanel(false);
    
    // Focus back on the text input after selection
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };
  
  // Handle hashtag input
  const handleHashtagChange = (text: string) => {
    // Remove # if user types it
    setCurrentHashtag(text.replace(/^#/, ''));
  };
  
  // Add hashtag
  const addHashtag = () => {
    const tag = currentHashtag.trim().toLowerCase();
    
    if (tag && !hashtags.includes(tag)) {
      if (hashtags.length < 5) {
        // Add haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setHashtags([...hashtags, tag]);
        setCurrentHashtag('');
      } else {
        Alert.alert('Limit Reached', 'You can add a maximum of 5 hashtags.');
      }
    }
  };
  
  // Remove hashtag
  const removeHashtag = (tag: string) => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHashtags(hashtags.filter(t => t !== tag));
  };
  
  // Pick image from library
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library to add images to your post.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Add haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setImages([...images, result.assets[0].uri]);
    }
  };
  
  // Remove image
  const removeImage = (index: number) => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };
  
  // Validate post before submission
  const validatePost = (): boolean => {
    const trimmedContent = content.trim();
    return trimmedContent.length > 0 && trimmedContent.length <= CHAR_LIMIT;
  };

  // Handle visibility selection
  const handleSelectVisibility = (visibility: 'public' | 'followers' | 'anonymous') => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (visibility === 'public') {
      setIsPublic(true);
      setIsAnonymous(false);
    } else if (visibility === 'followers') {
      setIsPublic(false);
      setIsAnonymous(false);
    } else if (visibility === 'anonymous') {
      setIsPublic(false);
      setIsAnonymous(true);
    }
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
      console.log('Is anonymous:', isAnonymous);
      
      // Create post with the anonymous flag if selected
      await createPost({
        content,
        media_url: uploadedImageUrls,
        hashtags,
        is_public: isPublic,
        is_anonymous: isAnonymous
      });
      
      console.log('Post created successfully');
      
      // Reset form fields
      setContent('');
      setImages([]);
      setHashtags([]);
      setIsPublic(true);
      setIsAnonymous(false);
      
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
      <LinearGradient
        colors={['#f9f9f9', '#ffffff']}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={handleCancel}
            >
              <ArrowLeft size={22} color="#333" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Create Post</Text>
            
            <TouchableOpacity
              style={[
                styles.postButton,
                { opacity: validatePost() ? 1 : 0.7 }
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
            contentContainerStyle={styles.scrollViewContent}
          >
            <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
              {/* Visibility Options */}
              <View style={styles.privacySelector}>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    isPublic && !isAnonymous && styles.privacyOptionSelected
                  ]}
                  onPress={() => handleSelectVisibility('public')}
                >
                  <Globe size={16} color={isPublic && !isAnonymous ? '#0066CC' : '#666'} />
                  <Text 
                    style={[
                      styles.privacyText,
                      isPublic && !isAnonymous && styles.privacyTextSelected
                    ]}
                  >
                    Public
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.privacyDivider}></View>
                
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    !isPublic && !isAnonymous && styles.privacyOptionSelected
                  ]}
                  onPress={() => handleSelectVisibility('followers')}
                >
                  <Users size={16} color={!isPublic && !isAnonymous ? '#0066CC' : '#666'} />
                  <Text 
                    style={[
                      styles.privacyText,
                      !isPublic && !isAnonymous && styles.privacyTextSelected
                    ]}
                  >
                    Followers
                  </Text>
                </TouchableOpacity>

                <View style={styles.privacyDivider}></View>
                
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    isAnonymous && styles.privacyOptionSelected
                  ]}
                  onPress={() => handleSelectVisibility('anonymous')}
                >
                  <UserX size={16} color={isAnonymous ? '#0066CC' : '#666'} />
                  <Text 
                    style={[
                      styles.privacyText,
                      isAnonymous && styles.privacyTextSelected
                    ]}
                  >
                    Anonymous
                  </Text>
                </TouchableOpacity>
              </View>

              {isAnonymous && (
                <View style={styles.anonymousInfoContainer}>
                  <Text style={styles.anonymousInfoText}>
                    Your identity will be hidden. Posts will display as "Anonymous Doctor" with no personal information.
                  </Text>
                </View>
              )}
            
              <View style={styles.textInputContainer}>
                <LinearGradient
                  colors={['#fcfcfc', '#ffffff']}
                  style={styles.inputGradient}
                >
                  <TextInput
                    ref={textInputRef}
                    style={[
                      styles.contentInput,
                      { height: Math.max(120, textHeight) }
                    ]}
                    placeholder="What's on your mind? Share medical insights or ask questions..."
                    placeholderTextColor="#aaaaaa"
                    multiline
                    value={content}
                    onChangeText={handleContentChange}
                    onContentSizeChange={(e) => setTextHeight(e.nativeEvent.contentSize.height)}
                    onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
                    autoFocus
                    maxLength={CHAR_LIMIT + 50} // Give a little buffer before hard cutoff
                  />
                </LinearGradient>
                
                <Text style={[
                  styles.charCounter, 
                  content.length > CHAR_LIMIT * 0.9 && styles.charCounterWarning,
                  content.length > CHAR_LIMIT && styles.charCounterError
                ]}>
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
                  <Hash size={16} color="#0066CC" />
                  <TextInput
                    style={styles.hashtagInput}
                    placeholder="Add hashtags (max 5)"
                    placeholderTextColor="#aaaaaa"
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
                    <Plus size={16} color="#FFF" />
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
          
          <Animated.View style={[styles.toolbar, toolbarAnimatedStyle]}>
            <TouchableOpacity style={styles.toolbarButton} onPress={pickImage}>
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <ImageIcon size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolbarButton}>
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <Camera size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolbarButton}>
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <Smile size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolbarButton}>
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <MapPin size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolbarButton}>
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <Tag size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
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
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  contentContainer: {
    padding: 16,
  },
  privacySelector: {
    flexDirection: 'row',
    marginVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    flex: 1,
  },
  privacyDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
    marginLeft: 4,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#666',
  },
  privacyTextSelected: {
    color: '#0066CC',
  },
  anonymousInfoContainer: {
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.12)',
  },
  anonymousInfoText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#0066CC',
    lineHeight: 18,
  },
  textInputContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputGradient: {
    borderRadius: 16,
    padding: 4,
  },
  contentInput: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40, // Space for the character counter
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  charCounter: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#999',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  charCounterWarning: {
    color: '#f59e0b',
  },
  charCounterError: {
    color: '#ef4444',
  },
  imagePreviewScroll: {
    marginBottom: 24,
  },
  imagePreviewContainer: {
    marginRight: 12,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashtagSection: {
    marginBottom: 20,
  },
  hashtagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  hashtagInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  addHashtagButton: {
    backgroundColor: '#0066CC',
    borderRadius: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
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
    borderTopColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  toolbarButton: {
    padding: 6,
    borderRadius: 20,
  },
  toolbarButtonGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
  },
  mentionContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  mentionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mentionAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mentionName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#333',
  },
}); 