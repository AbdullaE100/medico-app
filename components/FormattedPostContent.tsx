import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

interface FormattedPostContentProps extends TextProps {
  content: string;
  style?: any;
}

/**
 * Component that renders post content with special formatting:
 * - Removes poll markers (both formats)
 * - Could be extended for other formatting rules
 */
export const FormattedPostContent: React.FC<FormattedPostContentProps> = ({ content, style, ...props }) => {
  // Process the content to remove poll markers
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    
    // Remove poll markers from content:
    // Format 1: [poll:question] or [POLL:question]
    // Format 2: 📊 POLL: question [POLL]
    // Format 3: Just [POLL]
    let processed = content;
    
    // Remove the "📊 POLL: Question [POLL]" format
    processed = processed.replace(/📊\s*POLL:\s*.*?\s*\[POLL\]/g, '');
    
    // Remove the [poll:Question] format
    processed = processed.replace(/\[(poll|POLL|Poll):.*?\]/gi, '');
    
    // Remove standalone [POLL] marker
    processed = processed.replace(/\[POLL\]/g, '');
    
    // Clean up any extra whitespace from removals
    processed = processed.replace(/\n{3,}/g, '\n\n'); // Replace 3+ newlines with just 2
    processed = processed.trim(); // Remove leading/trailing whitespace
    
    return processed;
  }, [content]);
  
  return (
    <Text style={[styles.content, style]} {...props}>
      {processedContent}
    </Text>
  );
};

const styles = StyleSheet.create({
  content: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1A1A1A',
  },
}); 