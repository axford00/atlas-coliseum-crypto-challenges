// Remove the unused renderComment function since we're using map() now// src/components/coliseum/CommentSection.js
import {
    addDoc,
    collection,
    doc,
    increment,
    onSnapshot,
    orderBy,
    query,
    updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../../firebase';
import { colors } from '../../theme/colors';

const CommentSection = ({ 
  videoId, 
  onCommentCountChange,
  formatTimeAgo 
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (!videoId) return;

    const commentsRef = collection(db, 'challenge_responses', videoId, 'comments');
    const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = [];
      snapshot.forEach((doc) => {
        commentsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setComments(commentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching comments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [videoId]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting || !auth.currentUser) return;
    
    try {
      setSubmitting(true);
      
      // Add comment to subcollection
      await addDoc(collection(db, 'challenge_responses', videoId, 'comments'), {
        text: commentText.trim(),
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Warrior',
        createdAt: new Date(),
      });
      
      // Update comment count on main video document
      const videoRef = doc(db, 'challenge_responses', videoId);
      await updateDoc(videoRef, {
        commentCount: increment(1)
      });
      
      // Update parent component
      onCommentCountChange(1);
      
      setCommentText('');
      setShowInput(false);
      Keyboard.dismiss();
      
      Alert.alert('💬', 'Comment added!', [{ text: 'Great!' }]);
      
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Try again!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputSubmit = () => {
    Keyboard.dismiss();
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>🏆 {item.authorName}</Text>
        <Text style={styles.commentTime}>
          {formatTimeAgo(item.createdAt)}
        </Text>
      </View>
      <Text style={styles.commentText}>{item.text}</Text>
    </View>
  );

  const renderEmptyComments = () => (
    <View style={styles.emptyComments}>
      <Text style={styles.emptyCommentsIcon}>💬</Text>
      <Text style={styles.emptyCommentsText}>
        No comments yet. Be the first to share your thoughts!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Comments Header */}
      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>
          💬 Comments ({comments.length})
        </Text>
        <TouchableOpacity 
          style={[styles.addCommentButton, showInput && styles.addCommentButtonActive]}
          onPress={() => {
            console.log('💬 Add comment button pressed, showInput:', showInput);
            setShowInput(!showInput);
          }}
        >
          <Text style={styles.addCommentText}>
            {showInput ? '✕ Close' : '+ Add Comment'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comment Input */}
      {showInput && (
        <View style={styles.commentInputContainer}>
          <View style={styles.commentInputHeader}>
            <Text style={styles.commentInputTitle}>Share your thoughts</Text>
            <Text style={styles.commentInputCounter}>
              {commentText.length}/200
            </Text>
          </View>
          
          <TextInput
            style={[
              styles.commentInput,
              commentText.length > 0 && styles.commentInputActive
            ]}
            placeholder="This warrior crushed it! Great form on those..."
            placeholderTextColor={colors.text.secondary}
            value={commentText}
            onChangeText={(text) => {
              console.log('📝 Text input changed:', text);
              setCommentText(text);
            }}
            multiline
            maxLength={200}
            returnKeyType="done"
            onSubmitEditing={handleInputSubmit}
            blurOnSubmit={true}
            textAlignVertical="top"
            autoCorrect
            autoCapitalize="sentences"
            autoFocus={true} // Auto-focus when input appears
            editable={true} // Explicitly set as editable
            selectTextOnFocus={false} // Don't select all text on focus
          />
          
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.commentCancelButton}
              onPress={() => {
                console.log('❌ Cancel comment');
                setShowInput(false);
                setCommentText('');
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.commentCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.commentSubmitButton, 
                (!commentText.trim() || submitting) && styles.commentSubmitButtonDisabled
              ]}
              onPress={() => {
                console.log('📤 Submit comment:', commentText);
                handleSubmitComment();
              }}
              disabled={!commentText.trim() || submitting}
            >
              <Text style={styles.commentSubmitText}>
                {submitting ? 'Posting...' : '💬 Post Comment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Comments List - No FlatList to avoid nesting */}
      <View style={styles.commentsListContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading comments...</Text>
          </View>
        ) : comments.length === 0 ? (
          renderEmptyComments()
        ) : (
          <View style={styles.commentsList}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>
                    🏆 {comment.authorName || 'Unknown Warrior'}
                  </Text>
                  <Text style={styles.commentTime}>
                    {formatTimeAgo(comment.createdAt)}
                  </Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
    marginBottom: 10,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  addCommentButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  addCommentButtonActive: {
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addCommentText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentInputContainer: {
    backgroundColor: colors.ui.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 15,
    marginBottom: 15,
    marginTop: 10,
  },
  commentInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentInputTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentInputCounter: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  commentInput: {
    color: colors.text.primary,
    fontSize: 16,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: colors.background.dark,
    marginBottom: 15,
    fontFamily: 'System',
  },
  commentInputActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  commentCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.ui.inputBg,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  commentCancelText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentSubmitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  commentSubmitButtonDisabled: {
    opacity: 0.5,
  },
  commentSubmitText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentsListContainer: {
    flex: 1,
    minHeight: 150, // Ensure minimum space for comments
  },
  commentsList: {
    paddingVertical: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 8,
  },
  emptyComments: {
    padding: 30,
    alignItems: 'center',
  },
  emptyCommentsIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyCommentsText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  commentItem: {
    backgroundColor: colors.background.overlay,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
    marginRight: 10,
  },
  commentTime: {
    fontSize: 11,
    color: colors.text.secondary,
    flexShrink: 0,
  },
  commentText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});

export default CommentSection;