// src/components/buddies/BuddyRequestCard.js - Incoming buddy request card component
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';

const BuddyRequestCard = ({ request, onPress }) => {
  return (
    <TouchableOpacity style={styles.incomingRequestCard} onPress={onPress}>
      <View style={styles.requestHeader}>
        <View style={styles.requestAvatar}>
          <Text style={styles.requestAvatarText}>
            {request.fromUserName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{request.fromUserName}</Text>
          <Text style={styles.requestEmail}>{request.fromUserEmail}</Text>
          <Text style={styles.requestDate}>
            Sent {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.tapToRespondContainer}>
        <Text style={styles.tapToRespondText}>👆 Tap to respond</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  incomingRequestCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.text.primary,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  requestAvatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  requestEmail: {
    color: colors.text.primary,
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  requestDate: {
    color: colors.text.primary,
    fontSize: 12,
    opacity: 0.7,
  },
  tapToRespondContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  tapToRespondText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.9,
  },
});

export default BuddyRequestCard;