import { COLORS } from '@/constants/admissionTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Announcement = {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  created_at: string;
  created_by: string;
};

export default function AnnouncementsScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all_parents' | 'specific_class'>('all_parents');

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Holiday Notice - Feb 19',
      body: 'School will remain closed on February 19th for a public holiday. Regular classes will resume on February 20th.',
      target_audience: 'all_parents',
      created_at: '2 hours ago',
      created_by: 'Admin',
    },
    {
      id: '2',
      title: 'Parent-Teacher Meeting',
      body: 'Parent-teacher meetings are scheduled for next week. Please check your appointment slots in the app.',
      target_audience: 'all_parents',
      created_at: '1 day ago',
      created_by: 'Admin',
    },
    {
      id: '3',
      title: 'Annual Day Celebration',
      body: 'Our annual day celebration will be held on March 15th. All parents are invited to attend. More details will follow soon.',
      target_audience: 'all_parents',
      created_at: '3 days ago',
      created_by: 'Principal',
    },
  ]);

  const handleCreateAnnouncement = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing Information', 'Please fill in both title and message.');
      return;
    }

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: title.trim(),
      body: body.trim(),
      target_audience: targetAudience,
      created_at: 'Just now',
      created_by: 'Admin',
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    setTitle('');
    setBody('');
    setTargetAudience('all_parents');
    setShowCreateModal(false);

    Alert.alert('Success', 'Announcement has been posted successfully!');
  };

  const handleDeleteAnnouncement = (id: string) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAnnouncements(announcements.filter((a) => a.id !== id));
            Alert.alert('Deleted', 'Announcement has been deleted.');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Announcements</Text>
            <Text style={styles.headerSubtitle}>
              {announcements.length} total announcements
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            activeOpacity={0.8}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Announcements List */}
        <View style={styles.announcementsList}>
          {announcements.map((announcement) => (
            <View key={announcement.id} style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <View style={styles.announcementIcon}>
                  <Ionicons name="megaphone" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.announcementMeta}>
                  <Text style={styles.announcementTime}>{announcement.created_at}</Text>
                  <Text style={styles.announcementAuthor}>by {announcement.created_by}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteAnnouncement(announcement.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>

              <Text style={styles.announcementTitle}>{announcement.title}</Text>
              <Text style={styles.announcementBody}>{announcement.body}</Text>

              <View style={styles.audienceBadge}>
                <Ionicons name="people" size={14} color={COLORS.primary} />
                <Text style={styles.audienceText}>
                  {announcement.target_audience === 'all_parents' ? 'All Parents' : 'Specific Class'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Create Announcement Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Announcement</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter announcement title"
                  placeholderTextColor={COLORS.gray}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>

              {/* Message Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter announcement message"
                  placeholderTextColor={COLORS.gray}
                  value={body}
                  onChangeText={setBody}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {/* Target Audience */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Send To</Text>
                <View style={styles.audienceOptions}>
                  <TouchableOpacity
                    style={[
                      styles.audienceOption,
                      targetAudience === 'all_parents' && styles.audienceOptionActive,
                    ]}
                    onPress={() => setTargetAudience('all_parents')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={targetAudience === 'all_parents' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={targetAudience === 'all_parents' ? COLORS.primary : COLORS.gray}
                    />
                    <Text
                      style={[
                        styles.audienceOptionText,
                        targetAudience === 'all_parents' && styles.audienceOptionTextActive,
                      ]}
                    >
                      All Parents
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.audienceOption,
                      targetAudience === 'specific_class' && styles.audienceOptionActive,
                    ]}
                    onPress={() => setTargetAudience('specific_class')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={targetAudience === 'specific_class' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={targetAudience === 'specific_class' ? COLORS.primary : COLORS.gray}
                    />
                    <Text
                      style={[
                        styles.audienceOptionText,
                        targetAudience === 'specific_class' && styles.audienceOptionTextActive,
                      ]}
                    >
                      Specific Class
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Post Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCreateAnnouncement}
                style={{ marginTop: 8 }}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.postButton}
                >
                  <Ionicons name="send" size={18} color={COLORS.white} />
                  <Text style={styles.postButtonText}>Post Announcement</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  createBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Announcements List
  announcementsList: {
    gap: 12,
  },
  announcementCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  announcementIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementMeta: {
    flex: 1,
  },
  announcementTime: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  announcementAuthor: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  announcementBody: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  audienceText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },

  // Audience Options
  audienceOptions: {
    gap: 10,
  },
  audienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  audienceOptionActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  audienceOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  audienceOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Post Button
  postButton: {
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
