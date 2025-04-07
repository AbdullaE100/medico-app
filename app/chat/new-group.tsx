import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, ArrowLeft, Users, Check, X, Camera } from 'lucide-react-native';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { supabase } from '@/lib/supabase';

// Define a simple contact interface for this component
interface Contact {
  id: string;
  full_name: string;
  avatar_url?: string;
  is_online?: boolean;
}

export default function NewGroupChat() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select members, 2: Set group info
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  
  useEffect(() => {
    getUser();
    fetchContacts();
  }, []);
  
  // Get current user
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setCurrentUser({ id: data.user.id });
    }
  };
  
  // Function to fetch contacts (users the current user can message)
  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;
      
      // Get connections for the current user
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          status,
          user_id,
          connection_id,
          profile:profiles!connection_id(id, full_name, avatar_url, is_online)
        `)
        .or(`user_id.eq.${userData.user.id},connection_id.eq.${userData.user.id}`)
        .eq('status', 'accepted');
      
      if (error) throw error;
      
      // Format the data to get contacts
      const formattedContacts: Contact[] = [];
      
      for (const connection of data) {
        let contactProfile;
        
        if (connection.user_id === userData.user.id) {
          contactProfile = connection.profile;
        } else {
          // Fetch the profile if it's the other way around
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, is_online')
            .eq('id', connection.user_id)
            .single();
            
          contactProfile = profileData;
        }
        
        if (contactProfile) {
          formattedContacts.push({
            id: contactProfile.id,
            full_name: contactProfile.full_name,
            avatar_url: contactProfile.avatar_url,
            is_online: contactProfile.is_online
          });
        }
      }
      
      setContacts(formattedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle contact selection
  const toggleContactSelection = (contact: Contact) => {
    if (selectedContacts.some(c => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };
  
  // Proceed to next step
  const handleNextStep = () => {
    if (selectedContacts.length < 2) {
      Alert.alert('Error', 'Please select at least 2 contacts for a group chat');
      return;
    }
    setStep(2);
  };
  
  // Create group chat
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create a new group chat in the database
      const { data, error } = await supabase
        .from('chats')
        .insert({
          created_by: currentUser.id,
          is_group: true,
          group_name: groupName
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add all selected members to the group
      const membersToAdd = [
        ...selectedContacts.map(contact => ({
          chat_id: data.id,
          user_id: contact.id
        })),
        // Also add the current user
        {
          chat_id: data.id,
          user_id: currentUser.id,
          is_admin: true // Current user is admin
        }
      ];
      
      const { error: membersError } = await supabase
        .from('chat_members')
        .insert(membersToAdd);
      
      if (membersError) throw membersError;
      
      // Navigate to the new group chat
      router.push(`/chat/${data.id}`);
    } catch (error) {
      console.error('Error creating group chat:', error);
      Alert.alert('Error', 'Failed to create group chat');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const name = contact.full_name?.toLowerCase() || '';
    
    return name.includes(query);
  });
  
  if (isLoading) {
    return <LoadingOverlay message={step === 1 ? "Loading contacts..." : "Creating group..."} />;
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: step === 1 ? 'New Group' : 'Group Info',
          headerLeft: () => (
            <Pressable onPress={() => step === 1 ? router.back() : setStep(1)}>
              <ArrowLeft size={24} color="#007AFF" />
            </Pressable>
          ),
          headerRight: step === 1 ? () => (
            <Pressable 
              style={[
                styles.nextButton,
                selectedContacts.length < 2 && styles.disabledButton
              ]}
              onPress={handleNextStep}
              disabled={selectedContacts.length < 2}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </Pressable>
          ) : undefined
        }}
      />
      
      {step === 1 ? (
        // Step 1: Select contacts
        <>
          <View style={styles.selectedContactsPreview}>
            <Text style={styles.selectedLabel}>
              {selectedContacts.length > 0 
                ? `Selected contacts: ${selectedContacts.length}` 
                : 'Select contacts for your group'
              }
            </Text>
            {selectedContacts.length > 0 && (
              <FlatList
                data={selectedContacts}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable 
                    style={styles.selectedContactItem}
                    onPress={() => toggleContactSelection(item)}
                  >
                    <Image 
                      source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400' }} 
                      style={styles.selectedAvatar} 
                    />
                    <X size={16} color="#FFFFFF" style={styles.removeIcon} />
                    <Text style={styles.selectedContactName} numberOfLines={1}>
                      {item.full_name}
                    </Text>
                  </Pressable>
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.selectedContactsList}
              />
            )}
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="#666666" />
              <TextInput
                placeholder="Search contacts"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#666666"
              />
            </View>
          </View>
          
          <FlatList
            data={filteredContacts}
            renderItem={({ item }) => (
              <Pressable 
                style={styles.contactItem}
                onPress={() => toggleContactSelection(item)}
              >
                <Image 
                  source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400' }} 
                  style={styles.avatar} 
                />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.full_name}</Text>
                </View>
                <View style={[
                  styles.checkBox,
                  selectedContacts.some(c => c.id === item.id) && styles.checkedBox
                ]}>
                  {selectedContacts.some(c => c.id === item.id) && (
                    <Check size={16} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.contactsList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No contacts found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Connect with doctors to add them to your group
                </Text>
              </View>
            }
          />
        </>
      ) : (
        // Step 2: Set group info
        <View style={styles.groupInfoContainer}>
          <Pressable style={styles.groupImageContainer}>
            <View style={styles.groupImagePlaceholder}>
              <Users size={40} color="#8E8E93" />
            </View>
            <View style={styles.cameraButton}>
              <Camera size={16} color="#FFFFFF" />
            </View>
          </Pressable>
          
          <TextInput
            style={styles.groupNameInput}
            placeholder="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            placeholderTextColor="#8E8E93"
          />
          
          <Text style={styles.participantsLabel}>
            Participants: {selectedContacts.length}
          </Text>
          
          <FlatList
            data={selectedContacts}
            renderItem={({ item }) => (
              <View style={styles.participantItem}>
                <Image 
                  source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400' }} 
                  style={styles.participantAvatar} 
                />
                <Text style={styles.participantName}>{item.full_name}</Text>
              </View>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.participantsList}
          />
          
          <Pressable 
            style={[
              styles.createButton,
              !groupName.trim() && styles.disabledButton
            ]}
            onPress={handleCreateGroup}
            disabled={!groupName.trim()}
          >
            <Text style={styles.createButtonText}>Create Group</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#F2F2F7',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  contactsList: {
    paddingBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E5E5',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#1A1A1A',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  emptyState: {
    padding: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#8E8E93',
    textAlign: 'center',
  },
  selectedContactsPreview: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  selectedLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#8E8E93',
    marginLeft: 16,
    marginBottom: 8,
  },
  selectedContactsList: {
    paddingHorizontal: 12,
  },
  selectedContactItem: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 70,
  },
  selectedAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#E5E5E5',
  },
  removeIcon: {
    position: 'absolute',
    top: 0,
    right: 5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  selectedContactName: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    marginTop: 4,
    textAlign: 'center',
    width: 70,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 15,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Step 2 styles
  groupInfoContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  groupImageContainer: {
    marginTop: 20,
    marginBottom: 24,
    position: 'relative',
  },
  groupImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  groupNameInput: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
  },
  participantsLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#1A1A1A',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  participantsList: {
    width: '100%',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
  },
  participantName: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    marginLeft: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 30,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
}); 