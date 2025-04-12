import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart2, Check, Clock, AlertTriangle } from 'lucide-react-native';
import { usePollStore, Poll, getPollStore } from '@/stores/usePollStore';
import { useAuthStore } from '@/stores/useAuthStore';
import * as Haptics from 'expo-haptics';

interface PollCardProps {
  postId: string;
}

export const PollCard: React.FC<PollCardProps> = ({ postId }) => {
  const { currentUser } = useAuthStore();
  const pollStore = getPollStore();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [initialLoadDelay, setInitialLoadDelay] = useState(true);
  const [waitingForStartup, setWaitingForStartup] = useState(true);
  const maxRetries = 3;

  useEffect(() => {
    // Reduce the initial delay to make polls load faster
    const initialDelayTimer = setTimeout(() => {
      setInitialLoadDelay(false);
    }, 500); // Reduced from 1000ms to 500ms
    
    return () => clearTimeout(initialDelayTimer);
  }, []);

  useEffect(() => {
    // Don't load polls during initial app rendering to prevent startup errors
    if (initialLoadDelay) {
      return;
    }
    
    // Set the poll store as ready
    if (!pollStore.isStartupComplete) {
      console.log("Explicitly marking poll store as ready");
      pollStore.setStartupComplete();
    }
    
    // Check if the poll store is initialized
    const checkStoreInitialization = async () => {
      try {
        // Wait for poll store to complete startup, but not too long
        if (!pollStore.isStartupComplete) {
          console.log(`Waiting for poll store initialization to complete for post ${postId}`);
          setWaitingForStartup(true);
          
          // Check every 300ms if store is initialized
          const checkInterval = setInterval(() => {
            if (pollStore.isStartupComplete) {
              console.log(`Poll store initialization complete, proceeding to load poll for ${postId}`);
              clearInterval(checkInterval);
              setWaitingForStartup(false);
              loadPoll();
            } else {
              // If not ready after a couple of checks, force it to be ready
              console.log("Poll store not ready, forcing startup complete");
              pollStore.setStartupComplete();
            }
          }, 300); // Reduced from 500ms to 300ms
          
          // Set a timeout to prevent infinite waiting - reduced timeout
          setTimeout(() => {
            clearInterval(checkInterval);
            if (waitingForStartup) {
              console.warn(`Timed out waiting for poll store initialization for post ${postId}`);
              setWaitingForStartup(false);
              
              // Force startup complete and try loading anyway
              pollStore.setStartupComplete();
              loadPoll();
            }
          }, 3000); // Reduced from 8000ms to 3000ms
          
          return () => clearInterval(checkInterval);
        } else {
          // Store already initialized, load the poll directly
          setWaitingForStartup(false);
          loadPoll();
        }
      } catch (err) {
        console.error('Error checking poll store initialization:', err);
        setWaitingForStartup(false);
        setLoading(false);
        
        // Try to recover by setting startup complete and loading anyway
        pollStore.setStartupComplete();
        loadPoll();
      }
    };
    
    const loadPoll = async () => {
      if (retryCount > maxRetries) {
        console.log(`Maximum retries (${maxRetries}) reached for post ${postId}. Giving up.`);
        return;
      }
      
      console.log(`Loading poll for post ${postId}, attempt ${retryCount + 1}`);
      setLoading(true);
      setError(null);
      
      try {
        if (!postId) {
          throw new Error('Invalid post ID');
        }
        
        // Check if table exists and initialize if needed
        if (pollStore.tableExists === null) {
          console.log("Checking if polls table exists");
          await pollStore.checkTableExists();
        }
        
        if (pollStore.tableExists === false) {
          throw new Error('Poll database not configured');
        }
        
        console.log(`Fetching poll for post ID: ${postId}`);
        
        // Add timeout to prevent hanging requests - shorter timeout
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Poll retrieval timed out')), 5000) // Reduced from 8000ms
        );
        
        const fetchPollPromise = pollStore.getPoll(postId);
        
        // Race between fetching the poll and timeout
        const fetchedPoll = await Promise.race([fetchPollPromise, timeoutPromise]);
        
        if (!fetchedPoll) {
          console.warn(`No poll found for post ${postId}`);
          throw new Error('Poll not found for this post');
        }
        
        console.log(`Poll loaded successfully for post ${postId}:`, fetchedPoll.question);
        setPoll(fetchedPoll);
        setTimeRemaining(formatTimeRemaining(fetchedPoll));
      } catch (err) {
        console.error(`Error loading poll for post ${postId}:`, err);
        
        // Check for poll store error state
        if (pollStore.error) {
          setError(`Poll system error: ${pollStore.error}`);
          return;
        }
        
        // Handle different error types
        if (err instanceof Error) {
          // Check if it's a timeout error
          if (err.message.includes('timed out')) {
            setError('Loading poll timed out. Tap to retry.');
          } else if (err.message.includes('not found')) {
            setError('This poll is no longer available.');
          } else if (err.message.includes('not configured')) {
            setError('Poll feature needs setup.');
          } else {
            setError(`Tap to try again.`);
          }
        } else {
          setError('Tap to try again.');
        }
        
        // Schedule retry after a short delay - with exponential backoff
        if (retryCount < maxRetries) {
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 4000); // Reduced delays
          console.log(`Will retry loading poll for post ${postId} in ${backoffDelay/1000} seconds...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, backoffDelay);
        }
      } finally {
        setLoading(false);
      }
    };

    checkStoreInitialization();
    
    // Update timer every minute
    const timer = setInterval(() => {
      if (poll) {
        setTimeRemaining(formatTimeRemaining(poll));
      }
    }, 60000);
    
    return () => clearInterval(timer);
  }, [postId, retryCount, initialLoadDelay, pollStore.isStartupComplete, pollStore.tableExists, pollStore.error]);

  const handleRetry = () => {
    // Reset state and trigger a retry
    setRetryCount(0);
    setError(null);
    setLoading(true);
    setWaitingForStartup(true);
  };

  const handleVote = async (optionIndex: number) => {
    if (!currentUser) {
      Alert.alert('Sign in required', 'Please sign in to vote on polls');
      return;
    }
    
    if (!poll) return;
    
    if (poll.userVote !== undefined) {
      Alert.alert('Already voted', 'You have already voted on this poll');
      return;
    }
    
    if (!poll.isActive || isPollExpired(poll)) {
      Alert.alert('Poll closed', 'This poll has already ended');
      return;
    }
    
    setVoting(true);
    
    try {
      const success = await pollStore.vote(postId, optionIndex);
      
      if (success) {
        // Add haptic feedback for successful vote
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Refresh poll data
        const updatedPoll = await pollStore.getPoll(postId);
        setPoll(updatedPoll);
        if (updatedPoll) {
          setTimeRemaining(formatTimeRemaining(updatedPoll));
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('Failed to record your vote. Please try again.');
      }
    } catch (err) {
      console.error('Error voting on poll:', err);
      setError('Failed to vote. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setVoting(false);
    }
  };

  const isPollExpired = (poll: Poll): boolean => {
    const now = new Date();
    const expiresAt = new Date(poll.expires_at);
    return now > expiresAt;
  };

  const formatTimeRemaining = (poll: Poll): string => {
    if (!poll.isActive || isPollExpired(poll)) {
      return 'Closed';
    }
    
    const now = new Date();
    const expiresAt = new Date(poll.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} left`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} left`;
    } else {
      return 'Closing soon';
    }
  };

  if (loading || waitingForStartup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0066CC" />
        <Text style={styles.loadingText}>
          {waitingForStartup ? 'Loading poll...' : 'Loading poll...'}
        </Text>
      </View>
    );
  }

  if (error || !poll) {
    return (
      <View style={styles.errorContainer}>
        <TouchableOpacity onPress={handleRetry} style={styles.retryTouchable}>
          <AlertTriangle size={20} color="#cc3333" style={styles.errorIcon} />
          <Text style={styles.errorText}>{error || 'Poll not available. Tap to try again.'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f0f7ff', '#ffffff']}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <BarChart2 size={18} color="#0066CC" />
            <Text style={styles.title}>{poll.question}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.voteStat}>
              <Text style={styles.voteCount}>{poll.totalVotes}</Text>
              <Text style={styles.voteLabel}>{poll.totalVotes === 1 ? 'vote' : 'votes'}</Text>
            </View>
            
            <View style={styles.timeContainer}>
              <Clock size={13} color="#666666" />
              <Text style={styles.timeRemaining}>{timeRemaining}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.optionsContainer}>
          {poll.options.map((option, index) => {
            const isSelected = poll.userVote === index;
            const percentage = option.percentage || 0;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  poll.userVote !== undefined && styles.optionButtonVoted,
                  isSelected && styles.selectedOption
                ]}
                onPress={() => handleVote(index)}
                disabled={poll.userVote !== undefined || voting || !poll.isActive || isPollExpired(poll)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionTextRow}>
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText
                    ]}>
                      {option.text}
                    </Text>
                    
                    {isSelected && <Check size={16} color="#0066CC" />}
                  </View>
                  
                  {poll.userVote !== undefined && (
                    <View style={styles.resultContainer}>
                      <View 
                        style={[
                          styles.progressBar,
                          {width: `${percentage}%`},
                          isSelected && styles.selectedProgressBar
                        ]} 
                      />
                      <Text style={styles.percentage}>{percentage}%</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {voting && (
          <View style={styles.votingOverlay}>
            <ActivityIndicator size="small" color="#0066CC" />
            <Text style={styles.votingText}>Recording your vote...</Text>
          </View>
        )}
        
        {!poll.isActive || isPollExpired(poll) ? (
          <Text style={styles.closedText}>This poll has ended</Text>
        ) : poll.userVote !== undefined ? (
          <Text style={styles.votedText}>You voted for "{poll.options[poll.userVote].text}"</Text>
        ) : (
          <Text style={styles.instructionText}>Tap an option to vote</Text>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  gradientBackground: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8f0',
  },
  header: {
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginRight: 4,
  },
  voteLabel: {
    fontSize: 13,
    color: '#666666',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRemaining: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 4,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionButton: {
    backgroundColor: '#f5f8fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e8f0',
  },
  optionButtonVoted: {
    padding: 12,
  },
  selectedOption: {
    borderColor: '#0066CC',
    backgroundColor: '#eaf2ff',
  },
  optionContent: {
    width: '100%',
  },
  optionTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionText: {
    fontSize: 15,
    color: '#333333',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#0066CC',
  },
  resultContainer: {
    height: 22,
    backgroundColor: '#f0f0f0',
    borderRadius: 11,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 6,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#a2c8f5',
    borderRadius: 11,
  },
  selectedProgressBar: {
    backgroundColor: '#0066CC',
  },
  percentage: {
    position: 'absolute',
    right: 10,
    top: 2,
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7faff',
    borderRadius: 12,
    height: 120,
  },
  loadingText: {
    marginTop: 8,
    color: '#666666',
    fontSize: 14,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffcccc',
    minHeight: 100,
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    color: '#cc3333',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryTouchable: {
    width: '100%',
    alignItems: 'center',
    padding: 8,
  },
  votingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  votingText: {
    marginTop: 8,
    color: '#0066CC',
    fontSize: 14,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666666',
    marginTop: 8,
  },
  votedText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: '#0066CC',
    marginTop: 8,
  },
  closedText: {
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic',
    color: '#999999',
    marginTop: 8,
  },
}); 