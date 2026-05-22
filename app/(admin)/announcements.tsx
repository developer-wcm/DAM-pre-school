import { COLORS } from '@/constants/admissionTheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
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
  file_url?: string | null;
  creator_name?: string;
};

export default function AnnouncementsScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all_parents' | 'all_teachers' | 'everyone'>('all_parents');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Fetch announcements from Supabase
  useEffect(() => {
    fetchAnnouncements();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles:created_by (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        target_audience: item.target_audience,
        created_at: formatDate(item.created_at),
        created_by: item.created_by,
        creator_name: item.profiles?.full_name || 'Unknown',
        file_url: item.file_url,
      })) || [];

      setAnnouncements(formatted);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadFile = async (file: DocumentPicker.DocumentPickerAsset): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      // Read file as base64
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            
            const { error: uploadError } = await supabase.storage
              .from('school-files')
              .upload(filePath, decode(base64Data), {
                contentType: file.mimeType || 'application/octet-stream',
              });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('school-files')
              .getPublicUrl(filePath);

            resolve(publicUrl);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing Information', 'Please fill in both title and message.');
      return;
    }

    setUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        setUploading(false);
        return;
      }

      let fileUrl = null;
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
      }

      const { error } = await supabase
        .from('announcements')
        .insert({
          created_by: user.id,
          title: title.trim(),
          body: body.trim(),
          target_audience: targetAudience,
          file_url: fileUrl,
        });

      if (error) throw error;

      setTitle('');
      setBody('');
      setTargetAudience('all_parents');
      setSelectedFile(null);
      setShowCreateModal(false);

      Alert.alert('Success', 'Announcement has been posted successfully!');
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', error.message || 'Failed to create announcement');
    } finally {
      setUploading(false);
    }
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
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);

              if (error) throw error;
              Alert.alert('Deleted', 'Announcement has been deleted.');
            } catch (error: any) {
              console.error('Error deleting announcement:', error);
              Alert.alert('Error', 'Failed to delete announcement');
            }
          },
        },
      ]
    );
  };

  const openFile = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Cannot open file');
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      </LinearGradient>
    );
  }

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
          {announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={64} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>No Announcements Yet</Text>
              <Text style={styles.emptyText}>Create your first announcement to get started</Text>
            </View>
          ) : (
            announcements.map((announcement) => (
              <View key={announcement.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <View style={styles.announcementIcon}>
                    <Ionicons name="megaphone" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.announcementMeta}>
                    <Text style={styles.announcementTime}>{announcement.created_at}</Text>
                    <Text style={styles.announcementAuthor}>by {announcement.creator_name}</Text>
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

                {announcement.file_url && (
                  <TouchableOpacity
                    style={styles.fileAttachment}
                    onPress={() => openFile(announcement.file_url!)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="document-attach" size={16} color={COLORS.primary} />
                    <Text style={styles.fileText}>View Attachment</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.audienceBadge}>
                  <Ionicons name="people" size={14} color={COLORS.primary} />
                  <Text style={styles.audienceText}>
                    {announcement.target_audience === 'all_parents' ? 'All Parents' : 
                     announcement.target_audience === 'all_teachers' ? 'All Teachers' : 'Everyone'}
                  </Text>
                </View>
              </View>
            ))
          )}
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
                      targetAudience === 'all_teachers' && styles.audienceOptionActive,
                    ]}
                    onPress={() => setTargetAudience('all_teachers')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={targetAudience === 'all_teachers' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={targetAudience === 'all_teachers' ? COLORS.primary : COLORS.gray}
                    />
                    <Text
                      style={[
                        styles.audienceOptionText,
                        targetAudience === 'all_teachers' && styles.audienceOptionTextActive,
                      ]}
                    >
                      All Teachers
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.audienceOption,
                      targetAudience === 'everyone' && styles.audienceOptionActive,
                    ]}
                    onPress={() => setTargetAudience('everyone')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={targetAudience === 'everyone' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={targetAudience === 'everyone' ? COLORS.primary : COLORS.gray}
                    />
                    <Text
                      style={[
                        styles.audienceOptionText,
                        targetAudience === 'everyone' && styles.audienceOptionTextActive,
                      ]}
                    >
                      Everyone
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* File Attachment */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Attachment (Optional)</Text>
                <TouchableOpacity
                  style={styles.filePickerBtn}
                  onPress={pickDocument}
                  activeOpacity={0.7}
                >
                  <Ionicons name="attach" size={20} color={COLORS.primary} />
                  <Text style={styles.filePickerText}>
                    {selectedFile ? selectedFile.name : 'Attach File'}
                  </Text>
                </TouchableOpacity>
                {selectedFile && (
                  <TouchableOpacity
                    style={styles.removeFileBtn}
                    onPress={() => setSelectedFile(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeFileText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Post Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCreateAnnouncement}
                disabled={uploading}
                style={{ marginTop: 8 }}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.postButton}
                >
                  {uploading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color={COLORS.white} />
                      <Text style={styles.postButtonText}>Post Announcement</Text>
                    </>
                  )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  fileText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
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

  // File Picker
  filePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filePickerText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  removeFileBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  removeFileText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
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
