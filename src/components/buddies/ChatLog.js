// src/components/buddies/ChatLog.js - Clean WhatsApp/iMessage Style Chat
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { colors } from '../../theme/colors';

const ChatLog = ({ chatMessages, buddyName, formatMessageTime }) => {
  if (!chatMessages || chatMessages.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>💬 Chat History</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No messages yet. Send the first message to get the conversation started!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>💬 Chat History</Text>
      
      <View style={styles.chatContainer}>
        <ScrollView 
          style={styles.chatScrollView}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          inverted={true}
        >
          {chatMessages.map((message, index) => {
            const isFromUser = message.direction === 'to_buddy';
            const showSender = index === chatMessages.length - 1 || 
                             chatMessages[index + 1]?.direction !== message.direction;
            
            return (
              <View key={message.id} style={[
                styles.messageWrapper,
                isFromUser ? styles.sentMessageWrapper : styles.receivedMessageWrapper
              ]}>
                <View 
                  style={[
                    styles.messageBubble,
                    isFromUser ? styles.sentBubble : styles.receivedBubble
                  ]}
                >
                  <Text style={[
                    styles.messageText,
                    isFromUser ? styles.sentText : styles.receivedText
                  ]}>
                    {message.message}
                  </Text>
                  
                  <Text style={[
                    styles.messageTime,
                    isFromUser ? styles.sentTime : styles.receivedTime
                  ]}>
                    {formatMessageTime(message.createdAt)}
                  </Text>
                </View>
                
                {showSender && !isFromUser && (
                  <Text style={styles.senderLabel}>{buddyName}</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  
  // Chat Container - Clean background
  chatContainer: {
    backgroundColor: '#1a1a1a', // Dark chat background like modern apps
    borderRadius: 12,
    height: 300,
    overflow: 'hidden',
  },
  chatScrollView: {
    flex: 1,
  },
  chatContent: {
    padding: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  
  // Message Wrappers - Control alignment
  messageWrapper: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  sentMessageWrapper: {
    justifyContent: 'flex-end',
  },
  receivedMessageWrapper: {
    justifyContent: 'flex-start',
  },
  
  // Message Bubbles - Invisible/transparent style
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 8,
    paddingVertical: 6,
    // No background, no borders, no shadows - completely invisible!
  },
  
  // Sent Messages - No bubble, just text
  sentBubble: {
    // Completely transparent
    backgroundColor: 'transparent',
  },
  sentText: {
    color: colors.primary, // Use your app's primary color
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'right',
  },
  sentTime: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
    opacity: 0.6,
  },
  
  // Received Messages - No bubble, just text
  receivedBubble: {
    // Completely transparent
    backgroundColor: 'transparent',
  },
  receivedText: {
    color: colors.text.primary, // Regular text color
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'left',
  },
  receivedTime: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'left',
    opacity: 0.6,
  },
  
  // Sender label - minimal
  senderLabel: {
    color: colors.text.secondary,
    fontSize: 11,
    marginLeft: 18,
    marginTop: 2,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  
  // Empty State - Clean
  emptyState: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    opacity: 0.8,
  },
});

export default ChatLog;