// utils/contactScanner.js
import * as Contacts from 'expo-contacts';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

const auth = getAuth();

export const requestContactsPermission = async () => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return {
      granted: status === 'granted',
      status
    };
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return {
      granted: false,
      error: error.message
    };
  }
};

export const scanUserContacts = async () => {
  try {
    console.log('Starting contact scan...');
    
    // Get contacts using Expo's API
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.Emails,
        Contacts.Fields.PhoneNumbers
      ],
    });

    console.log(`Found ${data.length} contacts`);
    
    // Format contacts for our needs
    const formattedContacts = data
      .filter(contact => {
        // Only include contacts with email or phone
        const hasEmail = contact.emails && contact.emails.length > 0;
        const hasPhone = contact.phoneNumbers && contact.phoneNumbers.length > 0;
        return hasEmail || hasPhone;
      })
      .map(contact => ({
        id: contact.id,
        name: contact.name || 'Unknown Contact',
        firstName: contact.firstName,
        lastName: contact.lastName,
        emails: contact.emails?.map(email => email.email.toLowerCase().trim()) || [],
        phones: contact.phoneNumbers?.map(phone => 
          phone.number.replace(/\D/g, '') // Remove non-digits
        ) || []
      }));

    console.log(`Formatted ${formattedContacts.length} valid contacts`);
    return {
      success: true,
      contacts: formattedContacts
    };
    
  } catch (error) {
    console.error('Error scanning contacts:', error);
    return {
      success: false,
      error: error.message,
      contacts: []
    };
  }
};

// Enhanced name extraction from email addresses
const extractNameFromEmail = (email) => {
  try {
    const localPart = email.split('@')[0].toLowerCase();
    
    // Common patterns to extract names
    let nameGuess = localPart;
    
    // Remove common suffixes/prefixes
    nameGuess = nameGuess.replace(/^(mr|mrs|ms|dr|prof)\.?/gi, '');
    nameGuess = nameGuess.replace(/(\.?(jr|sr|ii|iii|iv)\.?)$/gi, '');
    
    // Remove numbers and common email patterns
    nameGuess = nameGuess.replace(/\d+/g, '');
    nameGuess = nameGuess.replace(/[-_.]/g, ' ');
    
    // Remove common words that aren't names
    nameGuess = nameGuess.replace(/\b(email|mail|contact|info|admin|user|the|and|fitness|gym|ajax|blockchain)\b/gi, '');
    
    // Clean up extra spaces
    nameGuess = nameGuess.trim().replace(/\s+/g, ' ');
    
    if (nameGuess.length < 2) return null;
    
    // Capitalize each word
    const words = nameGuess.split(' ').filter(word => word.length > 1); // Only words longer than 1 char
    const capitalizedName = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return capitalizedName;
  } catch (error) {
    console.error('Error extracting name from email:', error);
    return null;
  }
};

// Enhanced contact matching with better name-based search
const findMatchingContactByName = (contacts, extractedName, originalEmail) => {
  if (!extractedName) return null;
  
  const nameParts = extractedName.toLowerCase().split(' ').filter(part => part.length > 1);
  
  // Score-based matching to find the best contact
  let bestMatch = null;
  let bestScore = 0;
  
  for (const contact of contacts) {
    const contactName = contact.name.toLowerCase();
    const firstName = contact.firstName?.toLowerCase() || '';
    const lastName = contact.lastName?.toLowerCase() || '';
    
    let score = 0;
    
    // Exact full name match (highest score)
    if (contactName === extractedName.toLowerCase()) {
      score = 100;
    }
    
    // All name parts found in contact name
    else if (nameParts.length > 1 && nameParts.every(part => contactName.includes(part))) {
      score = 80;
    }
    
    // First name + last name match
    else if (nameParts.length >= 2) {
      const extractedFirst = nameParts[0];
      const extractedLast = nameParts[nameParts.length - 1];
      
      if (firstName.includes(extractedFirst) && lastName.includes(extractedLast)) {
        score = 90;
      } else if (firstName.includes(extractedFirst) || lastName.includes(extractedLast)) {
        score = 60;
      }
    }
    
    // Single name match (like "Lori" matching "Lori Axford")
    else if (nameParts.length === 1) {
      const singleName = nameParts[0];
      if (firstName === singleName || lastName === singleName) {
        score = 70; // Good match for single name
      } else if (firstName.includes(singleName) || lastName.includes(singleName) || contactName.includes(singleName)) {
        score = 50; // Partial match
      }
    }
    
    // Boost score if contact name is shorter (more likely to be right match)
    if (score > 0 && contactName.length < 20) {
      score += 10;
    }
    
    // Only accept matches with minimum score
    if (score >= 50 && score > bestScore) {
      bestMatch = contact;
      bestScore = score;
    }
  }
  
  // Log the matching decision
  if (bestMatch && bestScore >= 50) {
    console.log(`✅ NAME MATCH: "${extractedName}" → "${bestMatch.name}" (score: ${bestScore})`);
    return bestMatch;
  } else {
    console.log(`❌ No good match for "${extractedName}" (best score: ${bestScore})`);
    return null;
  }
};

export const findAtlasUsers = async (contacts, currentUserEmail) => {
  try {
    console.log('🔍 Searching for Atlas users...');
    const foundUsers = [];
    const usersRef = collection(db, 'users');
    
    // Get all emails and phones from contacts
    const allEmails = [];
    const allPhones = [];
    
    contacts.forEach(contact => {
      allEmails.push(...contact.emails);
      allPhones.push(...contact.phones);
    });
    
    // Remove duplicates and current user
    const uniqueEmails = [...new Set(allEmails)].filter(email => 
      email !== currentUserEmail.toLowerCase()
    );
    const uniquePhones = [...new Set(allPhones)];
    
    // Get ALL users from the database for name matching
    console.log('📋 Fetching user database for matching...');
    const allUsersSnapshot = await getDocs(usersRef);
    const allUsers = [];
    allUsersSnapshot.forEach(doc => {
      if (doc.id !== auth.currentUser?.uid) { // Exclude current user
        allUsers.push({ id: doc.id, ...doc.data() });
      }
    });
    
    console.log(`👥 Found ${allUsers.length} registered users`);
    
    // 1. DIRECT EMAIL MATCHING (existing logic)
    const emailBatches = chunkArray(uniqueEmails, 10);
    for (const emailBatch of emailBatches) {
      if (emailBatch.length > 0) {
        const emailQuery = query(usersRef, where('email', 'in', emailBatch));
        const emailSnapshot = await getDocs(emailQuery);
        
        emailSnapshot.forEach(doc => {
          const userData = doc.data();
          console.log('📧 Direct email match:', userData.email);
          const matchingContact = findMatchingContact(contacts, userData.email, null);
          
          if (matchingContact) {
            foundUsers.push({
              id: doc.id,
              ...userData,
              contactInfo: matchingContact,
              matchedBy: 'email'
            });
          }
        });
      }
    }
    
    // 2. PHONE NUMBER MATCHING (existing logic)
    const phoneBatches = chunkArray(uniquePhones, 10);
    for (const phoneBatch of phoneBatches) {
      if (phoneBatch.length > 0) {
        const phoneQuery = query(usersRef, where('phone', 'in', phoneBatch));
        const phoneSnapshot = await getDocs(phoneQuery);
        
        phoneSnapshot.forEach(doc => {
          const userData = doc.data();
          console.log('📱 Phone match:', userData.phone);
          const matchingContact = findMatchingContact(contacts, null, userData.phone);
          
          if (matchingContact && !foundUsers.find(user => user.id === doc.id)) {
            foundUsers.push({
              id: doc.id,
              ...userData,
              contactInfo: matchingContact,
              matchedBy: 'phone'
            });
          }
        });
      }
    }
    
    // 3. SMART NAME-BASED MATCHING FROM EMAIL ADDRESSES
    console.log('🧠 Starting smart name extraction...');
    let nameMatches = 0;
    
    for (const user of allUsers) {
      // Skip if already found
      if (foundUsers.find(found => found.id === user.id)) continue;
      
      // Extract potential name from email
      const extractedName = extractNameFromEmail(user.email);
      
      if (extractedName) {
        console.log(`🔤 Email: ${user.email} → Name: "${extractedName}"`);
        
        // Try to find matching contact by name
        const matchingContact = findMatchingContactByName(contacts, extractedName, user.email);
        
        if (matchingContact) {
          foundUsers.push({
            id: user.id,
            ...user,
            contactInfo: matchingContact,
            matchedBy: 'name_from_email',
            extractedName // Include this for debugging
          });
          nameMatches++;
        }
      }
    }
    
    console.log(`🎯 Results: ${foundUsers.length} total matches (${nameMatches} from name extraction)`);
    
    return {
      success: true,
      users: foundUsers
    };
    
  } catch (error) {
    console.error('Error finding Atlas users:', error);
    return {
      success: false,
      error: error.message,
      users: []
    };
  }
};

const findMatchingContact = (contacts, email, phone) => {
  return contacts.find(contact => {
    if (email && contact.emails.includes(email.toLowerCase())) {
      return true;
    }
    if (phone) {
      // Clean the phone number for comparison
      const cleanPhone = phone.replace(/\D/g, '');
      return contact.phones.some(contactPhone => {
        const cleanContactPhone = contactPhone.replace(/\D/g, '');
        // Match if last 10 digits are the same (handles country codes)
        return cleanPhone.slice(-10) === cleanContactPhone.slice(-10);
      });
    }
    return false;
  });
};

const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Generate demo data for testing
export const generateDemoUsers = (contacts) => {
  console.log('Generating demo users for testing...');
  
  const demoUsers = contacts.slice(0, 3).map((contact, index) => ({
    id: `demo_${Date.now()}_${index}`,
    email: contact.emails[0] || `demo${index}@example.com`,
    displayName: contact.name,
    profileImage: null,
    contactInfo: contact,
    matchedBy: 'email',
    // Demo fitness data
    currentStreak: Math.floor(Math.random() * 30) + 1,
    totalWorkouts: Math.floor(Math.random() * 100) + 10,
    lastWorkoutDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastWorkoutType: ['Upper Body', 'Cardio', 'Leg Day', 'HIIT', 'Yoga'][Math.floor(Math.random() * 5)],
    fitnessGoals: ['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance'][Math.floor(Math.random() * 4)],
    isDemo: true
  }));
  
  return {
    success: true,
    users: demoUsers
  };
};