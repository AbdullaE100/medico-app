import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { PollCard } from './PollCard';
import { getPollStore } from '@/stores/usePollStore';
import { useIsFocused } from '@react-navigation/native';
import { AlertTriangle, BarChart2 } from 'lucide-react-native';

interface PollExtractorProps {
  content: string;
  postId: string;
}

/**
 * This component checks if a post contains poll markers and renders the appropriate poll component if found.
 * It also handles checking if the polls table exists in the database.
 */
export const PollExtractor: React.FC<PollExtractorProps> = ({ content, postId }: PollExtractorProps) => {
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [tableChecking, setTableChecking] = useState<boolean>(true);
  const [pollQuestion, setPollQuestion] = useState<string | null>(null);
  const [pollExists, setPollExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingPoll, setIsCheckingPoll] = useState<boolean>(false);
  const isFocused = useIsFocused();
  
  // Extract poll question from content
  useEffect(() => {
    if (!content) return;
    
    try {
      // Look for poll markers in the content - support multiple formats:
      // 1. [poll:question] or [POLL:question] or [Poll:question]
      // 2. 📊 POLL: question [POLL]
      const pollRegexOld = /\[(poll|POLL|Poll):(.*?)\]/i;
      const pollRegexNew = /📊\s*POLL:\s*(.*?)\s*\[POLL\]/i;
      
      // Try the new format first
      const matchNew = content.match(pollRegexNew);
      if (matchNew && matchNew[1]) {
        // Found a poll question in new format
        const question = matchNew[1].trim();
        if (question.length > 0) {
          console.log('Found poll question in new format:', question);
          setPollQuestion(question);
          return;
        }
      }
      
      // Fall back to old format if new format not found
      const matchOld = content.match(pollRegexOld);
      if (matchOld && matchOld[2]) {
        // Found a poll question in old format
        const question = matchOld[2].trim();
        if (question.length > 0) {
          console.log('Found poll question in old format:', question);
          setPollQuestion(question);
          return;
        }
      }
      
      // Check for just [POLL] marker (second image shows this case)
      if (content.includes('[POLL]')) {
        console.log('Found plain poll marker, using generic question');
        setPollQuestion('Poll');
        return;
      }
      
      // No poll marker found in either format
      console.log('No poll marker found in content');
      setPollQuestion(null);
    } catch (err) {
      console.error('Error extracting poll question:', err);
      setPollQuestion(null);
    }
  }, [content]);
  
  // Check if the poll actually exists in the database before trying to render it
  useEffect(() => {
    if (!pollQuestion || !postId) return;

    let isMounted = true;
    
    const checkPollExists = async () => {
      if (!isMounted) return;
      
      setIsCheckingPoll(true);
      
      try {
        // Force startup complete to avoid initialization issues
        const pollStore = getPollStore();
        if (!pollStore.isStartupComplete) {
          pollStore.setStartupComplete();
        }
        
        // Check if table exists
        await pollStore.checkTableExists();
        
        // Quick check if poll exists for this post
        const pollData = await pollStore.getPoll(postId);
        
        if (isMounted) {
          setPollExists(!!pollData);
          if (!pollData) {
            setError("This poll is no longer available.");
          }
          setIsCheckingPoll(false);
        }
      } catch (err) {
        console.error(`Error checking if poll exists for post ${postId}:`, err);
        if (isMounted) {
          setError("Unable to load poll. Try again later.");
          setPollExists(false);
          setIsCheckingPoll(false);
        }
      }
    };
    
    checkPollExists();
    
    return () => {
      isMounted = false;
    };
  }, [pollQuestion, postId]);

  // Check if polls table exists with debounce to reduce database queries
  useEffect(() => {
    // Skip check if we already determined the table exists or if no poll question was found
    if (tableExists === true || !pollQuestion) return;
    
    let isMounted = true;
    let checkTimeout: NodeJS.Timeout;
    
    const checkPollsTable = async () => {
      if (!isMounted) return;
      
      try {
        setTableChecking(true);
        setError(null);
        
        // Get the poll store instance and check if table exists
        const pollStore = getPollStore();
        
        // Set startup complete to avoid initialization issues
        pollStore.setStartupComplete();
        
        console.log('Checking if polls table exists...');
        const exists = await pollStore.checkTableExists();
        
        if (isMounted) {
          console.log('Polls table exists:', exists);
          setTableExists(exists);
          
          // Check if poll store has an error state
          if (pollStore.error) {
            console.warn('Poll store has an error:', pollStore.error);
            setError(pollStore.error);
          }
        }
      } catch (err) {
        console.error('Error checking polls table:', err);
        if (isMounted) {
          setError('Failed to check database configuration');
          setTableExists(false);
        }
      } finally {
        if (isMounted) {
          setTableChecking(false);
        }
      }
    };
    
    // Start check when component mounts or when screen is focused
    if (isFocused) {
      // Reduced timeout for faster response
      checkTimeout = setTimeout(checkPollsTable, 200);
    }
    
    return () => {
      isMounted = false;
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
    };
  }, [pollQuestion, tableExists, isFocused]);
  
  // If no poll question found, don't render anything
  if (!pollQuestion) {
    return null;
  }
  
  // If still checking poll table or checking if poll exists
  if ((tableChecking || isCheckingPoll) && pollExists !== false) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainerImproved}>
          <View style={styles.loadingHeader}>
            <BarChart2 size={16} color="#0066CC" />
            <Text style={styles.loadingTitle}>Poll</Text>
          </View>
          <ActivityIndicator size="small" color="#0066CC" />
          <Text style={styles.loadingText}>Loading poll...</Text>
        </View>
      </View>
    );
  }
  
  // If poll doesn't exist or there was an error
  if (pollExists === false || error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainerImproved}>
          <View style={styles.errorHeader}>
            <BarChart2 size={16} color="#666666" />
            <Text style={styles.errorTitle}>Poll</Text>
          </View>
          <View style={styles.errorContent}>
            <AlertTriangle size={18} color="#999999" style={styles.errorIcon} />
            <Text style={styles.errorText}>
              {error || 'This poll is no longer available.'}
            </Text>
          </View>
        </View>
      </View>
    );
  }
  
  // If polls table doesn't exist
  if (tableExists === false) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainerImproved}>
          <View style={styles.messageHeader}>
            <BarChart2 size={16} color="#666666" />
            <Text style={styles.messageTitle}>Poll</Text>
          </View>
          <Text style={styles.messageText}>
            Poll feature is not available on this device.
          </Text>
        </View>
      </View>
    );
  }
  
  // If poll appears to exist and we should render it
  return (
    <View style={styles.container}>
      <PollCard postId={postId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  // Old styles
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7faff',
    borderRadius: 12,
    height: 80,
  },
  loadingText: {
    marginTop: 8,
    color: '#666666',
    fontSize: 14,
  },
  messageContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    height: 80,
  },
  messageText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    height: 80,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  errorIcon: {
    marginBottom: 6,
  },
  errorText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Improved styles with headers
  loadingContainerImproved: {
    backgroundColor: '#f7faff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e8f0',
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f6ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8f0',
  },
  loadingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginLeft: 6,
  },
  errorContainerImproved: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 6,
  },
  errorContent: {
    alignItems: 'center',
    padding: 16,
  },
  messageContainerImproved: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 6,
  },
}); 