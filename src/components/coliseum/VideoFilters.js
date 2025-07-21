// src/components/coliseum/VideoFilters.js
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../../theme/colors';

const VideoFilters = ({ filter, onFilterChange }) => {
  return (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterTab, filter === 'recent' && styles.filterTabActive]}
        onPress={() => onFilterChange('recent')}
      >
        <Text style={[styles.filterText, filter === 'recent' && styles.filterTextActive]}>
          🕒 Recent
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, filter === 'popular' && styles.filterTabActive]}
        onPress={() => onFilterChange('popular')}
      >
        <Text style={[styles.filterText, filter === 'popular' && styles.filterTextActive]}>
          🔥 Popular
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: colors.background.overlay,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: colors.text.primary,
  },
});

export default VideoFilters;