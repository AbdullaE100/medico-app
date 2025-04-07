import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
} from 'react-native';

export interface MarkdownRendererProps {
  content: string | undefined;
}

// Different types of markdown blocks
type BlockType = 'paragraph' | 'heading' | 'code' | 'quote' | 'list' | 'image';

interface MdBlock {
  type: BlockType;
  content: string;
  level?: number; // For headings (h1, h2, etc.)
  items?: string[]; // For lists
  language?: string; // For code blocks
  url?: string; // For images
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const processedContent = content || '';
  const blocks = processMd(processedContent);
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </ScrollView>
  );
};

// Process markdown string into structured blocks
function processMd(mdString: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  const lines = mdString.split('\n');
  
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeContent: string[] = [];
  let inList = false;
  let listItems: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      if (!inCodeBlock) {
        // Start of code block
        inCodeBlock = true;
        codeLanguage = trimmedLine.slice(3).trim();
        codeContent = [];
      } else {
        // End of code block
        inCodeBlock = false;
        blocks.push({
          type: 'code',
          content: codeContent.join('\n'),
          language: codeLanguage
        });
        codeLanguage = '';
        codeContent = [];
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }
    
    // Handle list items
    if (trimmedLine.match(/^[\*\-\+]\s/) || trimmedLine.match(/^\d+\.\s/)) {
      const listItem = trimmedLine.replace(/^[\*\-\+]\s/, '').replace(/^\d+\.\s/, '');
      
      if (!inList) {
        // Start new list
        inList = true;
        listItems = [listItem];
      } else {
        // Continue existing list
        listItems.push(listItem);
      }
      continue;
    } else if (inList && trimmedLine === '') {
      // End of list
      inList = false;
      blocks.push({
        type: 'list',
        content: '',
        items: listItems
      });
      listItems = [];
    }
    
    // Handle headings
    if (trimmedLine.startsWith('#')) {
      const match = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const content = match[2];
        blocks.push({
          type: 'heading',
          content: content,
          level: level
        });
      }
      continue;
    }
    
    // Handle blockquotes
    if (trimmedLine.startsWith('>')) {
      const content = trimmedLine.slice(1).trim();
      blocks.push({
        type: 'quote',
        content: content
      });
      continue;
    }
    
    // Handle images
    const imageMatch = trimmedLine.match(/!\[(.*?)\]\((.*?)\)/);
    if (imageMatch) {
      const alt = imageMatch[1];
      const url = imageMatch[2];
      blocks.push({
        type: 'image',
        content: alt,
        url: url
      });
      continue;
    }
    
    // Handle paragraphs
    if (trimmedLine !== '') {
      blocks.push({
        type: 'paragraph',
        content: trimmedLine
      });
    }
  }
  
  // Handle any remaining list
  if (inList) {
    blocks.push({
      type: 'list',
      content: '',
      items: listItems
    });
  }
  
  return blocks;
}

// Render a single markdown block
function renderBlock(block: MdBlock, index: number) {
  switch (block.type) {
    case 'paragraph':
      return (
        <View key={index} style={styles.paragraph}>
          <Text style={styles.text}>{processTextWithFormatting(block.content)}</Text>
        </View>
      );
      
    case 'heading':
      const headingStyles = [
        styles.h1,
        styles.h2,
        styles.h3,
        styles.h4,
        styles.h5,
        styles.h6
      ];
      
      return (
        <View key={index} style={styles.heading}>
          <Text style={[styles.headingText, headingStyles[Math.min((block.level || 1) - 1, 5)]]}>
            {block.content}
          </Text>
        </View>
      );
      
    case 'code':
      return (
        <View key={index} style={styles.codeBlock}>
          {block.language && <Text style={styles.codeLanguage}>{block.language}</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.code}>{block.content}</Text>
          </ScrollView>
        </View>
      );
      
    case 'quote':
      return (
        <View key={index} style={styles.blockquote}>
          <Text style={styles.quoteText}>{block.content}</Text>
        </View>
      );
      
    case 'list':
      return (
        <View key={index} style={styles.list}>
          {block.items?.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <View style={styles.listItemTextContainer}>
                <Text style={styles.listItemText}>{processTextWithFormatting(item)}</Text>
              </View>
            </View>
          ))}
        </View>
      );
      
    case 'image':
      const screenWidth = Dimensions.get('window').width;
      const imageWidth = screenWidth - 32; // Accounting for margins
      const imageHeight = imageWidth * 0.6; // 3:5 aspect ratio as a default
      
      return (
        <View key={index} style={styles.imageContainer}>
          <Image
            source={{ uri: block.url }}
            style={[styles.image, { width: imageWidth, height: imageHeight }]}
            resizeMode="contain"
          />
          {block.content ? (
            <Text style={styles.imageCaption}>{block.content}</Text>
          ) : null}
        </View>
      );
      
    default:
      return null;
  }
}

// A simpler implementation to handle basic markdown formatting
function processTextWithFormatting(text: string): React.ReactNode {
  // For now, just return the text as is
  // In a real implementation, you would parse and render bold, italic, links, etc.
  return text;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  paragraph: {
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  heading: {
    marginTop: 8,
    marginBottom: 16,
  },
  headingText: {
    fontWeight: 'bold',
    color: '#111',
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    marginTop: 24,
    marginBottom: 16,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    marginTop: 20,
    marginBottom: 14,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    marginTop: 16,
    marginBottom: 12,
  },
  h4: {
    fontSize: 18,
    lineHeight: 26,
    marginTop: 12,
    marginBottom: 10,
  },
  h5: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  h6: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: '#f6f8fa',
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  codeLanguage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#dfe2e5',
    paddingLeft: 16,
    marginLeft: 0,
    marginRight: 0,
    marginVertical: 16,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4a5568',
    fontStyle: 'italic',
  },
  list: {
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  listBullet: {
    width: 16,
    fontSize: 16,
    color: '#666',
  },
  listItemTextContainer: {
    flex: 1,
  },
  listItemText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  imageContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  image: {
    borderRadius: 8,
  },
  imageCaption: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 