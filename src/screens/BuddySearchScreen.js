// screens/BuddySearchScreen.js - Search for workout buddies by username/name
import { getAuth } from 'firebase/auth';
import { addDoc, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';
import FalloutButton from '../components/ui/FalloutButton';
import { colors, globalStyles } from '../theme/colors';

const BuddySearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    loadRecentSearches();
    loadSentRequests();
  }, []);

  const loadRecentSearches = () => {
    // For now, we'll show some example recent searches
    // In a full implementation, you'd store these in AsyncStorage or user preferences
    setRecentSearches([
      'ming', 'jamie', 'alex', 'sarah', 'mike'
    ]);
  };

  const loadSentRequests = async () => {
    if (!user) return;
    
    try {
      const requestsRef = collection(db, 'buddy_requests');
      const outgoingQuery = query(
        requestsRef, 
        where('fromUserId', '==', user.uid),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(outgoingQuery);
      const requests = [];
      
      snapshot.forEach(doc => {
        requests.push(doc.data().toUserId);
      });
      
      setSentRequests(requests);
      console.log(`📤 Found ${requests.length} pending outgoing buddy requests`);
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  };

  // Improved searchUsers function with better email search and debugging
  const searchUsers = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    console.log(`🔍 Searching for users matching: "${searchQuery}"`);
    setSearching(true);
    
    try {
      const usersRef = collection(db, 'users');
      const results = new Map(); // Use Map to avoid duplicates
      
      // Normalize search query
      const lowerQuery = searchQuery.toLowerCase().trim();
      const upperQuery = searchQuery.toUpperCase().trim();
      const capitalizedQuery = searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1).toLowerCase().trim();
      
      console.log(`🔍 Testing variations: "${lowerQuery}", "${upperQuery}", "${capitalizedQuery}"`);
      
      // 1. EMAIL SEARCH (most reliable) - try different cases
      const emailQueries = [
        // Exact email match (case insensitive)
        query(usersRef, where('email', '==', lowerQuery)),
        query(usersRef, where('email', '==', upperQuery)),
        query(usersRef, where('email', '==', searchQuery)),
        
        // Email starts with search (for partial matches like "ming" -> "mingcnbc@gmail.com")
        query(usersRef, where('email', '>=', lowerQuery), where('email', '<=', lowerQuery + '\uf8ff'), limit(10)),
        query(usersRef, where('email', '>=', upperQuery), where('email', '<=', upperQuery + '\uf8ff'), limit(10))
      ];
      
      // 2. NAME SEARCHES - try all possible name fields and cases
      const nameQueries = [
        // name field variations
        query(usersRef, where('name', '>=', lowerQuery), where('name', '<=', lowerQuery + '\uf8ff'), limit(10)),
        query(usersRef, where('name', '>=', upperQuery), where('name', '<=', upperQuery + '\uf8ff'), limit(10)),
        query(usersRef, where('name', '>=', capitalizedQuery), where('name', '<=', capitalizedQuery + '\uf8ff'), limit(10)),
        
        // displayName field variations
        query(usersRef, where('displayName', '>=', lowerQuery), where('displayName', '<=', lowerQuery + '\uf8ff'), limit(10)),
        query(usersRef, where('displayName', '>=', upperQuery), where('displayName', '<=', upperQuery + '\uf8ff'), limit(10)),
        query(usersRef, where('displayName', '>=', capitalizedQuery), where('displayName', '<=', capitalizedQuery + '\uf8ff'), limit(10))
      ];
      
      // Execute all email queries first (most reliable)
      console.log('📧 Testing email queries...');
      for (let i = 0; i < emailQueries.length; i++) {
        try {
          const snapshot = await getDocs(emailQueries[i]);
          console.log(`📧 Email query ${i + 1} found ${snapshot.size} results`);
          
          snapshot.forEach(doc => {
            const userData = { id: doc.id, ...doc.data() };
            if (userData.id !== user.uid) {
              results.set(doc.id, userData);
              console.log(`✅ Found by email: ${userData.email} (Name: ${getUserDisplayName(userData)})`);
            }
          });
        } catch (error) {
          console.log(`❌ Email query ${i + 1} failed:`, error.message);
        }
      }
      
      // Execute name queries
      console.log('👤 Testing name queries...');
      for (let i = 0; i < nameQueries.length; i++) {
        try {
          const snapshot = await getDocs(nameQueries[i]);
          console.log(`👤 Name query ${i + 1} found ${snapshot.size} results`);
          
          snapshot.forEach(doc => {
            const userData = { id: doc.id, ...doc.data() };
            if (userData.id !== user.uid) {
              results.set(doc.id, userData);
              console.log(`✅ Found by name: ${getUserDisplayName(userData)} (${userData.email})`);
            }
          });
        } catch (error) {
          console.log(`❌ Name query ${i + 1} failed:`, error.message);
        }
      }
      
      // If still no results, let's try a broader search
      if (results.size === 0) {
        console.log('🔍 No results found, trying broader search...');
        
        // Get first 50 users and search manually (fallback)
        try {
          const broadQuery = query(usersRef, limit(50));
          const broadSnapshot = await getDocs(broadQuery);
          
          console.log(`📊 Searching through ${broadSnapshot.size} users manually...`);
          
          broadSnapshot.forEach(doc => {
            const userData = { id: doc.id, ...doc.data() };
            if (userData.id === user.uid) return; // Skip current user
            
            // Check all possible fields for matches
            const searchFields = [
              userData.email?.toLowerCase(),
              userData.name?.toLowerCase(),
              userData.displayName?.toLowerCase(),
              userData.firstName?.toLowerCase(),
              userData.lastName?.toLowerCase(),
              userData.username?.toLowerCase()
            ].filter(Boolean); // Remove undefined values
            
            const isMatch = searchFields.some(field => 
              field.includes(lowerQuery) || lowerQuery.includes(field)
            );
            
            if (isMatch) {
              results.set(doc.id, userData);
              console.log(`✅ Manual match found: ${getUserDisplayName(userData)} (${userData.email})`);
              console.log(`   Matched fields:`, searchFields.filter(field => 
                field.includes(lowerQuery) || lowerQuery.includes(field)
              ));
            }
          });
        } catch (error) {
          console.log('❌ Broad search failed:', error);
        }
      }
      
      // Convert results to array and sort
      const resultArray = Array.from(results.values());
      
      // Sort by relevance
      resultArray.sort((a, b) => {
        const aEmail = (a.email || '').toLowerCase();
        const bEmail = (b.email || '').toLowerCase();
        const aName = (getUserDisplayName(a) || '').toLowerCase();
        const bName = (getUserDisplayName(b) || '').toLowerCase();
        
        // Exact email match first
        if (aEmail === lowerQuery && bEmail !== lowerQuery) return -1;
        if (bEmail === lowerQuery && aEmail !== lowerQuery) return 1;
        
        // Email starts with query
        if (aEmail.startsWith(lowerQuery) && !bEmail.startsWith(lowerQuery)) return -1;
        if (bEmail.startsWith(lowerQuery) && !aEmail.startsWith(lowerQuery)) return 1;
        
        // Name exact match
        if (aName === lowerQuery && bName !== lowerQuery) return -1;
        if (bName === lowerQuery && aName !== lowerQuery) return 1;
        
        // Name starts with query
        if (aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1;
        if (bName.startsWith(lowerQuery) && !aName.startsWith(lowerQuery)) return 1;
        
        // Alphabetical
        return aName.localeCompare(bName);
      });

      setSearchResults(resultArray);
      console.log(`✅ Final results: ${resultArray.length} users found`);
      
      // Log all final results
      resultArray.forEach((userData, index) => {
        console.log(`📋 Result ${index + 1}: ${getUserDisplayName(userData)} (${userData.email})`);
      });
      
    } catch (error) {
      console.error('❌ Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const sendBuddyRequest = async (targetUser) => {
    if (!user || !targetUser) return;

    console.log(`🚀 Sending buddy request to: ${getUserDisplayName(targetUser)}`);
    
    try {
      setLoading(true);

      const requestData = {
        fromUserId: user.uid,
        fromUserName: getUserDisplayName(user), // Use the same function for consistency
        fromUserEmail: user.email,
        toUserId: targetUser.id,
        toUserName: getUserDisplayName(targetUser), // FIXED: Use consistent naming
        toUserEmail: targetUser.email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        requestType: 'buddy_request'
      };

      console.log('📊 Buddy request data:', requestData);

      // Save buddy request
      const docRef = await addDoc(collection(db, 'buddy_requests'), requestData);
      console.log(`✅ Buddy request saved with ID: ${docRef.id}`);

      // Update sent requests list
      setSentRequests(prev => [...prev, targetUser.id]);

      Alert.alert(
        'Request Sent! 🚀',
        `Buddy request sent to ${getUserDisplayName(targetUser)}. They'll receive a notification to accept your request.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('❌ Error sending buddy request:', error);
      Alert.alert('Error', 'Failed to send buddy request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  let searchTimeout;

  const handleSearch = (text) => {
    setSearchQuery(text);
    // Debounce search to avoid too many queries
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      searchUsers(text);
    }, 800);
  };

  const selectRecentSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    searchUsers(searchTerm);
  };

  // FIXED: Check both 'name' and 'displayName' fields
  const getUserDisplayName = (userData) => {
    return userData.name || userData.displayName || userData.email?.split('@')[0] || 'Unknown User';
  };

  const getUserSubtitle = (userData) => {
    if (userData.profileDescription) {
      return userData.profileDescription.slice(0, 60) + '...';
    }
    if (userData.fitnessGoals && userData.fitnessGoals.length > 0) {
      return `Goal: ${userData.fitnessGoals.join(', ')}`;
    }
    if (userData.experience) {
      return `Experience: ${userData.experience}`;
    }
    return userData.email || 'No email';
  };

  const isRequestSent = (userId) => {
    return sentRequests.includes(userId);
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={globalStyles.hudCorner1} />
        <View style={globalStyles.hudCorner2} />
        <View style={globalStyles.hudCorner3} />
        <View style={globalStyles.hudCorner4} />

        {/* Header - FIXED: Removed back button, centered title */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleTop}>FIND</Text>
            <Text style={styles.titleBottom}>BUDDIES</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Search Section */}
          <View style={styles.searchSection}>
            <Text style={styles.searchLabel}>Search by name or email:</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="e.g., ming, mingcnbc, mingcnbc@gmail.com..."
                placeholderTextColor={colors.text.secondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searching && (
                <View style={styles.searchingIndicator}>
                  <Text style={styles.searchingText}>🔍</Text>
                </View>
              )}
            </View>
            <Text style={styles.searchHint}>
              Tip: Type at least 2 characters to start searching. Try "ming" or "mingcnbc"
            </Text>
          </View>

          {/* Recent Searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <View style={styles.recentSearches}>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchTag}
                    onPress={() => selectRecentSearch(search)}
                  >
                    <Text style={styles.recentSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searching ? 'Searching...' : `Search Results ${searchResults.length > 0 ? `(${searchResults.length})` : ''}`}
              </Text>
              
              {searchResults.length > 0 ? (
                searchResults.map((userData) => (
                  <View key={userData.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View style={styles.userAvatar}>
                        {userData.profileImage ? (
                          <Image source={{ uri: userData.profileImage }} style={styles.userAvatarImage} />
                        ) : (
                          <Text style={styles.userAvatarText}>
                            {getUserDisplayName(userData).charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {getUserDisplayName(userData)}
                        </Text>
                        <Text style={styles.userSubtitle}>
                          {getUserSubtitle(userData)}
                        </Text>
                        
                        {/* Show email for verification */}
                        <Text style={styles.userEmail}>
                          📧 {userData.email}
                        </Text>
                        
                        {/* User Stats */}
                        <View style={styles.userStats}>
                          {userData.currentStreak !== undefined && (
                            <Text style={styles.userStat}>
                              🔥 {userData.currentStreak} day streak
                            </Text>
                          )}
                          {userData.workoutsPerWeek && (
                            <Text style={styles.userStat}>
                              💪 {userData.workoutsPerWeek} workouts/week
                            </Text>
                          )}
                          {userData.experience && (
                            <Text style={styles.userStat}>
                              🎯 {userData.experience} level
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Action Button */}
                    <View style={styles.userActions}>
                      {isRequestSent(userData.id) ? (
                        <View style={styles.requestSentContainer}>
                          <Text style={styles.requestSentText}>✓ Request Sent</Text>
                        </View>
                      ) : (
                        <FalloutButton
                          text="SEND BUDDY REQUEST"
                          onPress={() => sendBuddyRequest(userData)}
                          style={styles.sendRequestButton}
                          type="secondary"
                          isLoading={loading}
                        />
                      )}
                    </View>
                  </View>
                ))
              ) : !searching && searchQuery.length >= 2 ? (
                <View style={styles.emptyResults}>
                  <Text style={styles.emptyResultsTitle}>No users found</Text>
                  <Text style={styles.emptyResultsText}>
                    No Atlas Fitness users match "{searchQuery}". Try:
                    {'\n'}• Checking the spelling
                    {'\n'}• Searching "mingcnbc" for Ming's account
                    {'\n'}• Using the full email: mingcnbc@gmail.com
                    {'\n'}• Using just the first name
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Instructions */}
          {!searchQuery && (
            <View style={styles.section}>
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>How to Find Workout Buddies</Text>
                <Text style={styles.instructionsText}>
                  🔍 <Text style={styles.instructionsBold}>Search by name:</Text> Type someone's first name, last name, or username
                  {'\n\n'}📧 <Text style={styles.instructionsBold}>Search by email:</Text> Enter their email address or just the beginning
                  {'\n\n'}👥 <Text style={styles.instructionsBold}>Send requests:</Text> Tap "Send Buddy Request" to connect
                  {'\n\n'}🏋️ <Text style={styles.instructionsBold}>Stay motivated:</Text> Challenge each other and share encouragement!
                  {'\n\n'}💡 <Text style={styles.instructionsBold}>Try searching:</Text> "mingcnbc" to find Ming's account
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    padding: 20,
  },

  // Header - UPDATED: Removed back button styling, centered title
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleTop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.secondary,
    letterSpacing: 3,
    marginBottom: -5,
  },
  titleBottom: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    letterSpacing: 2,
  },

  // Search Section
  searchSection: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  searchLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 8,
    color: colors.text.primary,
    fontSize: 16,
    padding: 15,
    paddingRight: 50,
  },
  searchingIndicator: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  searchingText: {
    fontSize: 18,
  },
  searchHint: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Sections
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },

  // Recent Searches
  recentSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentSearchTag: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  recentSearchText: {
    color: colors.text.light,
    fontSize: 14,
  },

  // User Cards
  userCard: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  userAvatarText: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 18,
  },
  userEmail: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  userStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  userStat: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // User Actions
  userActions: {
    alignItems: 'center',
  },
  sendRequestButton: {
    width: '100%',
  },
  requestSentContainer: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  requestSentText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Empty Results
  emptyResults: {
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  emptyResultsTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyResultsText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Instructions
  instructionsContainer: {
    backgroundColor: colors.background.overlay,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  instructionsTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  instructionsText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 22,
  },
  instructionsBold: {
    fontWeight: 'bold',
    color: colors.text.light,
  },
});

export default BuddySearchScreen;