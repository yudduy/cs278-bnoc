import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView, RefreshControl } from 'react-native';
import MeetupCard from './MeetupCard';
import { Meetup, User } from '../types';

const { width } = Dimensions.get('window');
const columnWidth = (width - 48) / 2; // 16px padding on each side and 16px gap

interface MasonryFeedProps {
  meetups: Meetup[];
  users: Record<string, User>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const MasonryFeed = ({ meetups, users, refreshing = false, onRefresh }: MasonryFeedProps) => {
  // Split meetups into two columns - left and right
  const leftColumn = meetups.filter((_, i) => i % 2 === 0);
  const rightColumn = meetups.filter((_, i) => i % 2 !== 0);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.columnsContainer}>
        <View style={styles.column}>
          {leftColumn.map(meetup => (
            <MeetupCard 
              key={meetup.id} 
              meetup={meetup} 
              user={users[meetup.participants[0]]}
              style={{ width: columnWidth }} 
            />
          ))}
        </View>
        <View style={styles.column}>
          {rightColumn.map(meetup => (
            <MeetupCard 
              key={meetup.id} 
              meetup={meetup} 
              user={users[meetup.participants[0]]}
              style={{ width: columnWidth }} 
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  columnsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default MasonryFeed;