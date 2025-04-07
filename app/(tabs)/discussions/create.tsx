import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Platform, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDiscussionsStore } from '@/stores/useDiscussionsStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Image, X, Tag, AlertCircle } from 'lucide-react-native';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function CreateDiscussion() {
  const router = useRouter();
  const { 
    categories, 
    isLoading, 
    error, 
    fetchCategories, 
    createDiscussion,
    fetchDiscussions 
  } = useDiscussionsStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAma, setIsAma] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [validation, setValidation] = useState({
    title: true,
    content: true,
    category: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const validateForm = () => {
    const validationState = {
      title: title.trim().length > 5,
      content: content.trim().length > 10,
      category: !!selectedCategory
    };
    
    setValidation(validationState);
    return Object.values(validationState).every(Boolean);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare the discussion data
      const discussionData = {
        title: title.trim(),
        content: content.trim(),
        category_id: selectedCategory,
        is_ama: isAma
      };

      // Add tags only if they exist and the backend supports it
      if (tags.length > 0) {
        // @ts-ignore - Adding tags if backend supports it
        discussionData.tags = tags;
      }

      const discussionId = await createDiscussion(discussionData);
      
      // Fetch updated discussions list
      await fetchDiscussions();
      
      // Navigate to the new discussion
      router.push(`/discussions/${discussionId}`);
    } catch (error) {
      console.error('Error creating discussion:', error);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (isLoading) {
    return <LoadingOverlay message="Creating discussion..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Discussion</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
            <X size={20} color="#666666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!title.trim() || !content.trim() || !selectedCategory) && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={!title.trim() || !content.trim() || !selectedCategory}
          >
            <Text style={styles.submitButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <ErrorMessage 
            message={error} 
            onDismiss={() => useDiscussionsStore.setState({ error: null })}
          />
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            {!validation.title && (
              <View style={styles.validationError}>
                <AlertCircle size={14} color="#e53e3e" />
                <Text style={styles.validationErrorText}>Title should be at least 5 characters</Text>
              </View>
            )}
            <TextInput
              style={[styles.titleInput, !validation.title && styles.inputError]}
              value={title}
              onChangeText={setTitle}
              placeholder="What would you like to discuss?"
              placeholderTextColor="#666666"
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            {!validation.category && (
              <View style={styles.validationError}>
                <AlertCircle size={14} color="#e53e3e" />
                <Text style={styles.validationErrorText}>Please select a category</Text>
              </View>
            )}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
            >
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonSelected
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category.id && styles.categoryButtonTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Content</Text>
            {!validation.content && (
              <View style={styles.validationError}>
                <AlertCircle size={14} color="#e53e3e" />
                <Text style={styles.validationErrorText}>Content should be at least 10 characters</Text>
              </View>
            )}
            <View style={[styles.richTextContainer, !validation.content && styles.inputError]}>
              <RichTextEditor 
                value={content}
                onChange={setContent}
                placeholder="Share your thoughts, insights, or questions..."
                minHeight={200}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagContainer}>
              {tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)} style={styles.tagRemove}>
                    <X size={12} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {showTagInput ? (
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    value={currentTag}
                    onChangeText={setCurrentTag}
                    placeholder="Add tag..."
                    placeholderTextColor="#888"
                    returnKeyType="done"
                    onSubmitEditing={addTag}
                    autoFocus
                    onBlur={() => {
                      addTag();
                      setShowTagInput(false);
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addTagButton} 
                  onPress={() => setShowTagInput(true)}
                  disabled={tags.length >= 5}
                >
                  <Tag size={14} color="#0066CC" />
                  <Text style={styles.addTagText}>Add Tag</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.tagHint}>Add up to 5 tags for better discoverability</Text>
          </View>

          <View style={styles.optionsGroup}>
            <Pressable 
              style={styles.optionButton}
              onPress={() => setIsAma(!isAma)}
            >
              <View style={[styles.checkbox, isAma && styles.checkboxChecked]} />
              <Text style={styles.optionText}>Mark as AMA (Ask Me Anything)</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0066CC',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1A1A1A',
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  richTextContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 200,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#e53e3e',
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  validationErrorText: {
    fontSize: 12,
    color: '#e53e3e',
    fontFamily: 'Inter_400Regular',
  },
  categories: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
  },
  categoryButtonSelected: {
    backgroundColor: '#0066CC',
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#666666',
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },
  contentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  optionsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  attachments: {
    flexDirection: 'row',
    gap: 8,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
  },
  attachButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#0066CC',
  },
  tagRemove: {
    marginLeft: 8,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  addTagText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#0066CC',
  },
  tagInputContainer: {
    flex: 1,
    minWidth: 100,
  },
  tagInput: {
    paddingVertical: 6,
    fontSize: 14,
  },
  tagHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
});