import React, { useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  Text,
  Image as RNImage,
  KeyboardAvoidingView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  Link, 
  Code, 
  Quote, 
  Heading
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Markdown patterns
const PATTERNS = {
  BOLD: /\*\*(.*?)\*\*/g,
  ITALIC: /\_(.*?)\_/g,
  CODE: /\`(.*?)\`/g,
  LINK: /\[(.*?)\]\((.*?)\)/g,
  H1: /^# (.*?)$/gm,
  H2: /^## (.*?)$/gm,
  H3: /^### (.*?)$/gm,
  QUOTE: /^> (.*?)$/gm,
  LIST_ITEM: /^- (.*?)$/gm,
  ORDERED_LIST_ITEM: /^(\d+)\. (.*?)$/gm,
  IMAGE: /!\[(.*?)\]\((.*?)\)/g,
};

interface RichTextEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  editorStyles?: any;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Share your thoughts...", 
  minHeight = 200,
  maxHeight = 400,
  editorStyles = {}
}: RichTextEditorProps) => {
  const inputRef = useRef<TextInput>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const insertAtCursor = (textToInsert: string) => {
    // Focus on the text input
    inputRef.current?.focus();
    
    // Get cursor position
    inputRef.current?.setNativeProps({
      selection: {
        start: value.length,
        end: value.length
      }
    });

    // Insert formatted text
    onChange(value + textToInsert);
  };

  const handleFormatBold = () => {
    insertAtCursor('**bold text**');
  };

  const handleFormatItalic = () => {
    insertAtCursor('_italic text_');
  };

  const handleFormatCode = () => {
    insertAtCursor('`code`');
  };

  const handleFormatLink = () => {
    insertAtCursor('[link text](https://example.com)');
  };

  const handleFormatHeading = () => {
    insertAtCursor('\n## Heading\n');
  };

  const handleFormatQuote = () => {
    insertAtCursor('\n> Quote\n');
  };

  const handleFormatList = () => {
    insertAtCursor('\n- Item 1\n- Item 2\n- Item 3\n');
  };

  const handleFormatOrderedList = () => {
    insertAtCursor('\n1. Item 1\n2. Item 2\n3. Item 3\n');
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      alert("You need to enable permission to access your photos!");
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Prepare file for upload
      const filename = uri.split('/').pop() || '';
      const fileExt = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `forum-images/${new Date().getTime()}.${fileExt}`;
      
      // Upload to Supabase
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type: `image/${fileExt}`
      } as any);
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, formData);
        
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
        
      // Insert markdown image tag
      insertAtCursor(`\n![Image](${publicUrl})\n`);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.editorContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.editor,
            editorStyles,
            { minHeight }
          ]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </ScrollView>
      
      {uploading && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
          <Text style={styles.progressText}>Uploading image...</Text>
        </View>
      )}
      
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
          <TouchableOpacity style={styles.toolbarButton} onPress={handleFormatBold}>
            <Bold size={20} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleFormatItalic}>
            <Italic size={20} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleFormatHeading}>
            <Heading size={20} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleFormatList}>
            <List size={20} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleFormatOrderedList}>
            <ListOrdered size={20} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleFormatCode}>
            <Code size={20} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleFormatQuote}>
            <Quote size={20} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleFormatLink}>
            <Link size={20} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handlePickImage}>
            <ImageIcon size={20} color="#555" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  editorContainer: {
    flex: 1,
  },
  editor: {
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333',
  },
  toolbar: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  toolbarContent: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  progressContainer: {
    padding: 8,
    backgroundColor: '#f0f9ff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#0066CC',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    color: '#0066CC',
    textAlign: 'center',
  },
}); 