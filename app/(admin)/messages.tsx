import { COLORS } from '@/constants/admissionTheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Conversation = {
  id: string;
  parent_id: string;
  teacher_id: string;
  parent_name: string;
  teacher_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
};

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(
        (conv) =>
          conv.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const fetchConversations = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          parent:profiles!conversations_parent_id_fkey(full_name),
          teacher:profiles!conversations_teacher_id_fkey(full_name),
          messages(content, created_at, is_read, sender_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map((conv: any) => {
        const messages = conv.messages || [];
        const lastMessage = messages[0];
        const unreadCount = messages.filter(
          (msg: any) => !msg.is_read && msg.sender_id !== user?.id
        ).length;

        return {
          id: conv.id,
          parent_id: conv.parent_id,
          teacher_id: conv.teacher_id,
          parent_name: conv.parent?.full_name || 'Unknown Parent',
          teacher_name: conv.teacher?.full_name || 'Unknown Teacher',
          last_message: lastMessage?.content || 'No messages yet',
          last_message_time: lastMessage ? formatDate(lastMessage.created_at) : '',
          unread_count: unreadCount,
        };
      }) || [];

      setConversations(formatted);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
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
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const openChat = (conversation: Conversation) => {
    router.push({
      pathname: '/(admin)/chat',
      params: {
        conversationId: conversation.id,
        parentName: conversation.parent_name,
        teacherName: conversation.teacher_name,
      },
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={COLORS.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Results Found' : 'No Conversations Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try searching with a different name'
                : 'Conversations will appear here when parents and teachers start messaging'}
            </Text>
          </View>
        ) : (
          filteredConversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationCard}
              activeOpacity={0.7}
              onPress={() => openChat(conversation)}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="people" size={24} color={COLORS.primary} />
                </View>
                {conversation.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationTitle} numberOfLines={1}>
                    {conversation.parent_name} ↔ {conversation.teacher_name}
                  </Text>
                  <Text style={styles.conversationTime}>{conversation.last_message_time}</Text>
                </View>
                <Text
                  style={[
                    styles.conversationMessage,
                    conversation.unread_count > 0 && styles.conversationMessageUnread,
                  ]}
                  numberOfLines={2}
                >
                  {conversation.last_message}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
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
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    paddingHorizontal: 40,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  conversationContent: {
    flex: 1,
    gap: 4,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  conversationTime: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    marginLeft: 8,
  },
  conversationMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  conversationMessageUnread: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
