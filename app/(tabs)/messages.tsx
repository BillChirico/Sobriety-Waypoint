import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Message, SponsorSponseeRelationship } from '@/types/database';
import { Send, MessageCircle } from 'lucide-react-native';

export default function MessagesScreen() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [relationships, setRelationships] = useState<SponsorSponseeRelationship[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  useEffect(() => {
    fetchRelationships();
  }, [profile]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedChat]);

  const fetchRelationships = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('sponsor_sponsee_relationships')
      .select('*, sponsor:sponsor_id(*), sponsee:sponsee_id(*)')
      .or(`sponsor_id.eq.${profile.id},sponsee_id.eq.${profile.id}`)
      .eq('status', 'active');
    setRelationships(data || []);
  };

  const fetchMessages = async () => {
    if (!selectedChat || !profile) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},recipient_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},recipient_id.eq.${profile.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !profile) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      recipient_id: selectedChat,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
      fetchMessages();
    }
  };

  const getChatPerson = (rel: SponsorSponseeRelationship) => {
    if (!profile) return null;
    return rel.sponsor_id === profile.id ? rel.sponsee : rel.sponsor;
  };

  const styles = createStyles(theme);

  if (!selectedChat) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>Stay connected with your sponsor/sponsees</Text>
        </View>

        <ScrollView style={styles.chatList}>
          {relationships.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageCircle size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>Connect with a sponsor or sponsee to start messaging</Text>
            </View>
          ) : (
            relationships.map(rel => {
              const person = getChatPerson(rel);
              return (
                <TouchableOpacity
                  key={rel.id}
                  style={styles.chatItem}
                  onPress={() => setSelectedChat(person?.id || null)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{person?.first_name?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>{person?.first_name} {person?.last_initial}.</Text>
                    <Text style={styles.chatRole}>
                      {rel.sponsor_id === profile?.id ? 'Sponsee' : 'Sponsor'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  const currentChat = relationships.find(r => getChatPerson(r)?.id === selectedChat);
  const chatPerson = getChatPerson(currentChat!);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle}>{chatPerson?.first_name} {chatPerson?.last_initial}.</Text>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender_id === profile?.id ? styles.sentMessage : styles.receivedMessage,
            ]}
          >
            <Text style={styles.messageText}>{msg.content}</Text>
            <Text style={styles.messageTime}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Send size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  chatInfo: {
    marginLeft: 12,
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  chatRole: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  chatHeader: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  chatHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#10b981',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.card,
  },
  messageText: {
    fontSize: 16,
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
