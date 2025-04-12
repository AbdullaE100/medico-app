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
  Dimensions,
  Modal
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
  UserX,
  BarChart,
  CheckCircle,
  Image as ImageSquare,
  Trash2,
  Minus
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
import * as Location from 'expo-location';
import { getPollStore } from '@/stores/usePollStore';

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
  
  // New state for enhanced functionality
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState(7);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [activeEmoji, setActiveEmoji] = useState('');
  const [recentEmojis, setRecentEmojis] = useState(['😊', '👍', '❤️', '🙏', '🩺', '🏥', '💉']);
  
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
      const post = await createPost({
        content,
        media_url: uploadedImageUrls,
        hashtags,
        is_public: isPublic,
        is_anonymous: isAnonymous
      });
      
      console.log('Post created successfully');
      
      // If we have poll data, create the poll and associate it with the post
      if (pollData && post && post.id) {
        console.log('Creating poll for post:', post.id);
        console.log('Poll data:', JSON.stringify(pollData));
        
        const pollStore = getPollStore();
        try {
          // Ensure we have a complete poll data structure
          const completePollData = {
            ...pollData,
            post_id: post.id,
            // Make sure all required fields are present
            created_at: pollData.created_at || new Date().toISOString(),
            expires_at: pollData.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            totalVotes: pollData.totalVotes || 0,
            voters: pollData.voters || [],
            isActive: true
          };
          
          // Create the poll
          const poll = await pollStore.createPoll(completePollData);
          
          if (poll) {
            console.log('Poll created successfully with ID:', poll.id);
          } else {
            console.error('Failed to create poll - no poll returned from createPoll');
            Alert.alert('Poll Creation Issue', 'Your post was created, but there was an issue with the poll. Please try again or contact support.');
          }
        } catch (pollError) {
          console.error('Error creating poll:', pollError);
          Alert.alert('Poll Creation Error', 'Your post was created, but there was an error with the poll. Please try again or contact support.');
        }
      }
      
      // Reset form fields
      setContent('');
      setImages([]);
      setHashtags([]);
      setIsPublic(true);
      setIsAnonymous(false);
      setPollData(null);
      
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
  
  // New methods for enhanced functionality
  
  // Poll related functions
  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Add a function to check if polls table exists
  const checkPollsTableExists = async () => {
    try {
      // Try to query the table
      const { error } = await supabase
        .from('polls')
        .select('id')
        .limit(1);
        
      if (error && error.code === '42P01') {
        // Table doesn't exist
        Alert.alert(
          'Poll Feature Not Set Up',
          'The polls database table has not been created yet. Please check the sql-scripts directory for setup instructions.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error checking poll table:', err);
      return false;
    }
  };

  // Show poll creation modal
  const handleShowPollModal = async () => {
    // First check if polls table exists
    const tableExists = await checkPollsTableExists();
    if (!tableExists) {
      return;
    }
    
    // If table exists, show the modal
    setShowPollModal(true);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const updatePollOption = (text: string, index: number) => {
    const newOptions = [...pollOptions];
    newOptions[index] = text;
    setPollOptions(newOptions);
  };

  const confirmPoll = () => {
    // Validate poll data
    if (!pollQuestion.trim()) {
      Alert.alert('Please enter a poll question');
      return;
    }

    // Filter out empty options and ensure we have at least 2
    const validOptions = pollOptions.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      Alert.alert('Please add at least 2 poll options');
      return;
    }

    // Create poll data structure with voting capabilities
    const newPollData = {
      question: pollQuestion.trim(),
      options: validOptions.map(option => ({
        text: option.trim(),
        votes: 0,  // Initialize votes count
        voters: [], // Will store user IDs who voted for this option
      })),
      duration: pollDuration,
      totalVotes: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + pollDuration * 24 * 60 * 60 * 1000).toISOString(),
      voters: [], // Will store all voters to prevent duplicate voting
      isActive: true,
      post_id: '' // Will be set when post is created
    };

    // Update content to better indicate poll presence
    setContent(prev => {
      // Remove any existing poll marker
      const contentWithoutPoll = prev.replace(/\n*📊\s*POLL:.*\[POLL\]\n*/g, '').trim();
      
      // Add poll data indicator with the question for clarity
      const pollIndicator = `\n\n📊 POLL: ${pollQuestion.trim()} [POLL]`;
      
      return contentWithoutPoll + pollIndicator;
    });

    // Save poll data to post
    setPollData(newPollData);
    setShowPollModal(false);
    
    // Give haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Show confirmation to the user
    Alert.alert('Poll Added', 'Your poll has been added to the post. Submit your post to publish it.');
    
    console.log('Poll data prepared:', JSON.stringify(newPollData));
  };

  // Location functions
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant location permission to use this feature.');
        return;
      }

      setLocationModalVisible(true);
      
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get readable address
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        const locationString = [
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        
        setLocation(locationString);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to fetch your location. Please try again.');
    }
  };

  const addLocationToPost = () => {
    if (location) {
      setContent(prevContent => {
        if (prevContent.trim()) {
          return `${prevContent}\n\n📍 ${location}`;
        }
        return `📍 ${location}`;
      });
      setLocationModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Emoji picker function
  const addEmojiToContent = (emoji: string) => {
    // Update recent emojis
    if (!recentEmojis.includes(emoji)) {
      setRecentEmojis(prev => [emoji, ...prev.slice(0, 6)]);
    }
    
    // Add emoji at cursor position
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    const newContent = `${beforeCursor}${emoji}${afterCursor}`;
    
    setContent(newContent);
    // Set cursor position after emoji
    setCursorPosition(cursorPosition + emoji.length);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmojiPickerVisible(false);
    
    // Focus back on text input
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  // Enhanced image picker with multiple selection
  const pickMultipleImages = async () => {
    if (images.length >= 4) {
      Alert.alert('Limit Reached', 'You can add a maximum of 4 images per post.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 4 - images.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        // Add haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Add selected images
        const newImages = [...images];
        result.assets.forEach(asset => {
          if (newImages.length < 4) {
            newImages.push(asset.uri);
          }
        });
        
        setImages(newImages);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  // Enhanced camera functionality
  const takePicture = async () => {
    if (images.length >= 4) {
      Alert.alert('Limit Reached', 'You can add a maximum of 4 images per post.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take pictures.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        // Add haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  // Render poll modal
  const renderPollModal = () => (
    <Modal
      visible={showPollModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPollModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowPollModal(false)}
      >
        <View style={styles.pollModalContainer}>
          <View style={styles.pollModalHeader}>
            <Text style={styles.pollModalTitle}>Create Poll</Text>
            <TouchableOpacity onPress={() => setShowPollModal(false)}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.pollModalContent}>
            <Text style={styles.pollModalLabel}>Question</Text>
            <TextInput
              style={styles.pollQuestionInput}
              placeholder="Ask a question..."
              value={pollQuestion}
              onChangeText={setPollQuestion}
              multiline
              maxLength={150}
            />
            
            <Text style={styles.pollModalLabel}>Options (2-4)</Text>
            {pollOptions.map((option, index) => (
              <View key={index} style={styles.pollOptionRow}>
                <TextInput
                  style={styles.pollOptionInput}
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChangeText={(text) => updatePollOption(text, index)}
                  maxLength={50}
                />
                {index > 1 && (
                  <TouchableOpacity 
                    style={styles.pollOptionRemoveButton}
                    onPress={() => removePollOption(index)}
                  >
                    <Minus size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            {pollOptions.length < 4 && (
              <TouchableOpacity 
                style={styles.addPollOptionButton}
                onPress={addPollOption}
              >
                <Plus size={20} color="#0066CC" />
                <Text style={styles.addPollOptionText}>Add Option</Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.pollModalLabel}>Poll Duration</Text>
            <View style={styles.pollDurationContainer}>
              {[1, 3, 7, 14].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.pollDurationOption,
                    pollDuration === days && styles.pollDurationOptionSelected
                  ]}
                  onPress={() => setPollDuration(days)}
                >
                  <Text 
                    style={[
                      styles.pollDurationText,
                      pollDuration === days && styles.pollDurationTextSelected
                    ]}
                  >
                    {days} {days === 1 ? 'day' : 'days'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.pollHelpText}>
              After posting, users can vote on your poll.
              Results will be displayed as percentages.
            </Text>
            
            <TouchableOpacity
              style={[
                styles.confirmPollButton,
                (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) && 
                  styles.confirmPollButtonDisabled
              ]}
              onPress={confirmPoll}
              disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
            >
              <Text style={styles.confirmPollButtonText}>Add Poll to Post</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render location modal
  const renderLocationModal = () => (
    <Modal
      visible={locationModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setLocationModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setLocationModalVisible(false)}
      >
        <View style={styles.locationModalContainer}>
          <View style={styles.locationModalHeader}>
            <Text style={styles.locationModalTitle}>Add Location</Text>
            <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
              <X size={22} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.locationModalContent}>
            {location ? (
              <>
                <View style={styles.locationResult}>
                  <MapPin size={24} color="#0066CC" />
                  <Text style={styles.locationText}>{location}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.addLocationButton}
                  onPress={addLocationToPost}
                >
                  <Text style={styles.addLocationButtonText}>Add to Post</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.locationLoading}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.locationLoadingText}>Finding your location...</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render emoji picker
  const renderEmojiPicker = () => (
    <Modal
      visible={emojiPickerVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setEmojiPickerVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setEmojiPickerVisible(false)}
      >
        <View style={styles.emojiPickerContainer}>
          <View style={styles.emojiPickerHeader}>
            <Text style={styles.emojiPickerTitle}>Select Emoji</Text>
            <TouchableOpacity onPress={() => setEmojiPickerVisible(false)}>
              <X size={22} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.emojiPickerContent}>
            <Text style={styles.emojiCategoryTitle}>Recent</Text>
            <View style={styles.emojiGrid}>
              {recentEmojis.map((emoji, index) => (
                <TouchableOpacity
                  key={`recent-${index}`}
                  style={styles.emojiItem}
                  onPress={() => addEmojiToContent(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.emojiCategoryTitle}>Medical</Text>
            <View style={styles.emojiGrid}>
              {['🩺', '💉', '🏥', '🧬', '🦠', '🧪', '🧫', '🧠', '❤️', '🫀', '🫁', '🦴', '👨‍⚕️', '👩‍⚕️', '🩸', '🩹'].map((emoji, index) => (
                <TouchableOpacity
                  key={`medical-${index}`}
                  style={styles.emojiItem}
                  onPress={() => addEmojiToContent(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.emojiCategoryTitle}>Common</Text>
            <View style={styles.emojiGrid}>
              {['😊', '👍', '👋', '🙏', '🎉', '🔥', '💯', '⭐', '😂', '❤️', '👏', '🤔', '😍', '🙌', '👀', '✅'].map((emoji, index) => (
                <TouchableOpacity
                  key={`common-${index}`}
                  style={styles.emojiItem}
                  onPress={() => addEmojiToContent(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Add this state variable for poll data
  const [pollData, setPollData] = useState<any>(null);
  
  // Add this function to reset form
  const resetForm = () => {
    setContent('');
    setImages([]);
    setHashtags([]);
    setHashtagInput('');
    setVisibility('public');
    setLocation(null);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollDuration(7);
    setPollData(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#ffffff', '#f5f9ff']}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
              <ArrowLeft size={22} color="#333" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Create Post</Text>
            
            <TouchableOpacity
              style={[
                styles.postButton,
                (!content.trim() && images.length === 0) && { opacity: 0.5 }
              ]}
              onPress={handlePostSubmit}
              disabled={(!content.trim() && images.length === 0) || isPosting}
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
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
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
            {/* Gallery Icon */}
            <TouchableOpacity style={styles.toolbarButton} onPress={pickMultipleImages}>
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <ImageIcon size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Camera Icon */}
            <TouchableOpacity style={styles.toolbarButton} onPress={takePicture}>
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <Camera size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Emoji Icon */}
            <TouchableOpacity style={styles.toolbarButton} onPress={() => setEmojiPickerVisible(true)}>
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <Smile size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Location Icon */}
            <TouchableOpacity style={styles.toolbarButton} onPress={getLocation}>
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <MapPin size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Tag Icon */}
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                textInputRef.current?.focus();
                const newContent = content + ' @';
                setContent(newContent);
                setCursorPosition(newContent.length);
              }}
            >
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <AtSign size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Poll Icon - New */}
            <TouchableOpacity style={styles.toolbarButton} onPress={handleShowPollModal}>
              <LinearGradient
                colors={['#f2f8ff', '#e6f0ff']}
                style={styles.toolbarButtonGradient}
              >
                <BarChart size={20} color="#0066CC" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
      
      {/* Render all modals */}
      {renderPollModal()}
      {renderLocationModal()}
      {renderEmojiPicker()}
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
  // New styles for poll modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pollModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  pollModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  pollModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  pollModalContent: {
    padding: 16,
  },
  pollModalLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  pollQuestionInput: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pollOptionInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  pollOptionRemoveButton: {
    padding: 8,
    marginLeft: 8,
  },
  addPollOptionButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  addPollOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
  pollDurationContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  pollDurationOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginHorizontal: 4,
  },
  pollDurationOptionSelected: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  pollDurationText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#666',
  },
  pollDurationTextSelected: {
    color: '#0066CC',
    fontFamily: 'Inter_600SemiBold',
  },
  pollHelpText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginBottom: 20,
  },
  confirmPollButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  confirmPollButtonDisabled: {
    backgroundColor: 'rgba(0, 102, 204, 0.5)',
  },
  confirmPollButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  
  // Location modal styles
  locationModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  locationModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  locationModalContent: {
    padding: 20,
  },
  locationLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  locationLoadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginTop: 16,
  },
  locationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  addLocationButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addLocationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  
  // Emoji picker styles
  emojiPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  emojiPickerContent: {
    padding: 16,
  },
  emojiCategoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginVertical: 10,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  emojiItem: {
    width: SCREEN_WIDTH / 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
}); 