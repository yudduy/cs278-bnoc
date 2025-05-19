import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meetup, User } from '../types';
import { COLORS } from '../config/theme';

interface MeetupCardProps {
  meetup: Meetup;
  user?: User;
  style?: object;
  onPress?: () => void;
}

const MeetupCard = ({ meetup, user, style, onPress }: MeetupCardProps) => {
  const getRandomHeight = () => {
    // For aesthetic variation
    return Math.floor(Math.random() * 100) + 150; // Min 150, max 250
  };

  const getCardBackgroundColor = (category: string) => {
    // Alternating colors based on category
    const categories = {
      'Run': 'rgba(177, 170, 129, 0.2)',
      'Workout': 'rgba(124, 122, 90, 0.2)',
      'Yoga': 'rgba(177, 170, 129, 0.3)',
      'Games': 'rgba(124, 122, 90, 0.3)',
      'Meditation': 'rgba(177, 170, 129, 0.25)',
      'Lectures': 'rgba(124, 122, 90, 0.25)',
    };
    
    return categories[category] || 'rgba(177, 170, 129, 0.2)';
  };

  // Infer category from meetup
  const category = meetup.category || (meetup.isVirtual ? 'Games' : 'Run');
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: getCardBackgroundColor(category),
          minHeight: getRandomHeight()
        },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={28} color={COLORS.text} />
          </View>
          <Text style={styles.username}>{user?.displayName || user?.username || 'User'}</Text>
        </View>
        <View style={styles.tagContainer}>
          <Text style={styles.tag}>#{category}</Text>
        </View>
      </View>

      <Text style={styles.title}>{meetup.title || "Unnamed Meetup"}</Text>
      
      {meetup.imageURL && (
        <Image 
          source={{ uri: meetup.imageURL || 'https://firebasestorage.googleapis.com/v0/b/stone-bison-446302-p0.firebasestorage.app/o/assets%2Fmb.jpeg?alt=media&token=e6e88f85-a09d-45cc-b6a4-cad438d1b2f6' }} 
          style={styles.image} 
          resizeMode="cover"
        />
      )}
      
      <View style={styles.dateContainer}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.text} />
        <Text style={styles.dateText}>
          {meetup.date instanceof Date ? meetup.date.toLocaleDateString() : 'No date'} 
          {meetup.time ? ` at ${meetup.time}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 8,
  },
  username: {
    fontFamily: 'ChivoRegular',
    fontSize: 14,
    color: COLORS.text,
  },
  tagContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tag: {
    fontFamily: 'ChivoRegular',
    fontSize: 12,
    color: COLORS.text,
  },
  title: {
    fontFamily: 'ChivoBold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'ChivoRegular',
    fontSize: 12,
    color: COLORS.text,
    marginLeft: 6,
  },
});

export default MeetupCard;