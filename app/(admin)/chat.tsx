import { COLORS } from '@/constants/admissionTheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Message = {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
  file_url?: string | null;
  file_name?: string | null;
  isMine: boolean;
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const conversationId = params.conversationId as string;
  const parentName = params.parentName as string;
  const teacherName = params.teacherName as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
    
    fetchMessages();
    markMessagesAsRead();

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          setMessages((prev) => [
            ...prev,
            {
              id: newMessage.id,
              content: newMessage.content,
              sender_id: newMessage.sender_id,
              is_read: newMessage.is_read,
              created_at: newMessage.created_at,
              file_url: newMessage.file_url,
              file_name: newMessage.file_name,
              isMine: newMessage.sender_id === currentUserId,
            },
          ]);
          if (newMessage.sender_id !== currentUserId) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const fetchMessages = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted = data?.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        is_read: msg.is_read,
        created_at: msg.created_at,
        file_url: msg.file_url,
        file_name: msg.file_name,
        isMine: msg.sender_id === user?.id,
      })) || [];

      setMessages(formatted);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user?.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
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
      const filePath = `messages/${fileName}`;

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

  const sendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSending(true);

    try {
      let fileUrl = null;
      let fileName = null;

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        fileName = selectedFile.name;
      }

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageText.trim() || '📎 Attachment',
        file_url: fileUrl,
        file_name: fileName,
        is_read: false,
      });

      if (error) throw error;

      setMessageText('');
      setSelectedFile(null);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const openFile = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Cannot open file');
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isMine && styles.messageContainerMine]}>
      <View style={[styles.messageBubble, item.isMine && styles.messageBubbleMine]}>
        {item.content && <Text style={[styles.messageText, item.isMine && styles.messageTextMine]}>{item.content}</Text>}
        
        {item.file_url && (
          <TouchableOpacity
            style={styles.fileAttachment}
            onPress={() => openFile(item.file_url!)}
            activeOpacity={0.7}
          >
            <Ionicons name="document-attach" size={16} color={item.isMine ? COLORS.white : COLORS.primary} />
            <Text style={[styles.fileName, item.isMine && styles.fileNameMine]} numberOfLines={1}>
              {item.file_name || 'Attachment'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, item.isMine && styles.messageTimeMine]}>
            {formatTime(item.created_at)}
          </Text>
          {item.isMine && (
            <Ionicons
              name={item.is_read ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={item.is_read ? COLORS.success : COLORS.white}
            />
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {parentName} ↔ {teacherName}
            </Text>
            <Text style={styles.headerSubtitle}>Parent-Teacher Chat</Text>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          {selectedFile && (
            <View style={styles.selectedFileContainer}>
              <View style={styles.selectedFile}>
                <Ionicons name="document" size={16} color={COLORS.primary} />
                <Text style={styles.selectedFileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <TouchableOpacity onPress={() => setSelectedFile(null)} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.inputBar}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={pickDocument}
              activeOpacity={0.7}
              disabled={sending}
            >
              <Ionicons name="attach" size={22} color={COLORS.primary} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.gray}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              editable={!sending}
            />

            <TouchableOpacity
              style={[styles.sendBtn, (!messageText.trim() && !selectedFile) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              activeOpacity={0.7}
              disabled={sending || (!messageText.trim() && !selectedFile)}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={18} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageContainerMine: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  messageBubbleMine: {
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  messageTextMine: {
    color: COLORS.white,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  fileNameMine: {
    color: COLORS.white,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
  },
  messageTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedFileContainer: {
    marginBottom: 8,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
