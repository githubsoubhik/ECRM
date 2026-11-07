"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Plus,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Briefcase,
  Paperclip,
  Smile,
  Mic,
  Square,
  Trash2,
  CheckCheck,
  ChevronLeft,
  X,
  FileText,
  Edit2,
  Check
} from 'lucide-react';
import styles from './page1.module.css';

interface Contact {
  id: number;
  name: string;
  avatar: string;
  avatarType?: 'image' | 'text';
  preview: string;
  time: string;
  unreadCount?: number;
  online: boolean;
  category: 'clients' | 'team';
  phone?: string;
  email?: string;
  location?: string;
  website?: string;
  clientSince?: string;
  brandType?: string;
}

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  status: 'sent' | 'delivered' | 'read';
  userAvatar?: string;
  mediaType?: 'text' | 'image' | 'file' | 'audio';
  mediaUrl?: string;
  fileName?: string;
}

const EMOJI_LIST = ['😊', '😂', '👍', '🙏', '❤️', '🔥', '🎉', '✨', '😍', '🤝', '🙌', '💯'];

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'clients' | 'team' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedContactId, setSelectedContactId] = useState<number | null>(1);
  const [messageInput, setMessageInput] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  // Profile Edit Mode State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<Contact>>({});

  // Feature States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<number | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State for New Member
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    category: 'clients' as 'clients' | 'team',
    email: '',
    phone: '',
    brandType: '',
    location: '',
    website: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      name: 'PureAyus',
      avatar: '🌿',
      avatarType: 'text',
      preview: "Sounds great! Let's proceed ...",
      time: '11:20 AM',
      unreadCount: 2,
      online: true,
      category: 'clients',
      phone: '+91 98765 43210',
      email: 'contact@pureayus.com',
      location: 'Bengaluru, Karnataka',
      website: 'www.pureayus.com',
      clientSince: '12 Jan 2026',
      brandType: 'Skincare Brand'
    },
    {
      id: 2,
      name: 'Zari Junction',
      avatar: 'ZJ',
      avatarType: 'text',
      preview: 'Can you share the updated ...',
      time: '10:45 AM',
      unreadCount: 1,
      online: true,
      category: 'clients'
    },
    {
      id: 3,
      name: 'Rohit Sharma',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      avatarType: 'image',
      preview: 'The homepage design is lookin...',
      time: 'Yesterday',
      online: false,
      category: 'team'
    },
    {
      id: 4,
      name: 'Sneha Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      avatarType: 'image',
      preview: 'Please review the content and...',
      time: 'Yesterday',
      online: false,
      category: 'team'
    },
    {
      id: 5,
      name: 'Bcosmetics',
      avatar: 'B',
      avatarType: 'text',
      preview: 'Thank you! 🙏',
      time: '2 Sep 2026',
      online: false,
      category: 'clients'
    },
    {
      id: 6,
      name: 'Ranitaz Makeover',
      avatar: 'RM',
      avatarType: 'text',
      preview: 'When can we schedule the call?',
      time: '2 Sep 2026',
      online: false,
      category: 'clients'
    },
    {
      id: 7,
      name: 'Aman Verma',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
      avatarType: 'image',
      preview: 'The SEO report is ready.',
      time: '1 Sep 2026',
      online: true,
      category: 'team'
    },
    {
      id: 8,
      name: 'Nexa Group',
      avatar: 'NG',
      avatarType: 'text',
      preview: "Let's discuss the mobile app...",
      time: '1 Sep 2026',
      online: true,
      category: 'clients'
    }
  ]);

  const [messagesData, setMessagesData] = useState<{ [key: number]: Message[] }>({
    1: [
      {
        id: 1,
        sender: 'PureAyus',
        content: 'Hi Priyanshu,\nI wanted to check the progress on the website development. Is everything on track?',
        timestamp: '10:15 AM',
        isOwn: false,
        status: 'read'
      },
      {
        id: 2,
        sender: 'You',
        content: "Hi,\nYes, the development is on track. We have completed the homepage and are now working on the inner pages. I'll share a staging link by tomorrow for your review.",
        timestamp: '10:25 AM',
        isOwn: true,
        status: 'read',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      },
      {
        id: 3,
        sender: 'PureAyus',
        content: "That's great!\nCan you also share a few sample product page designs? We'd like to review the layout and visuals before moving forward.",
        timestamp: '10:40 AM',
        isOwn: false,
        status: 'read'
      },
      {
        id: 4,
        sender: 'You',
        content: "Sure! I'll share the sample designs by EOD today.\n\nLet me know if you have any specific preferences for colors or sections.",
        timestamp: '10:52 AM',
        isOwn: true,
        status: 'read',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      },
      {
        id: 5,
        sender: 'PureAyus',
        content: "Sounds great! Let's proceed with that. Looking forward to the designs. 😊",
        timestamp: '11:20 AM',
        isOwn: false,
        status: 'read'
      }
    ]
  });

  const selectedContact = contacts.find(c => c.id === selectedContactId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContactId, messagesData]);

  // Focus input when search bar expands
  useEffect(() => {
    if (isSearchExpanded) {
      searchInputRef.current?.focus();
    }
  }, [isSearchExpanded]);

  // Close expandable search on clicking outside if input is empty
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node) &&
        !searchQuery
      ) {
        setIsSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  const handleSelectContact = (id: number) => {
    setSelectedContactId(id);
    setIsMobileChatOpen(true);
    setIsMobileProfileOpen(false);
    setIsEditingProfile(false);
    setShowEmojiPicker(false);
    setActiveMenuMessageId(null);
  };

  const handleSaveProfile = () => {
    if (!selectedContactId) return;
    setContacts(prev =>
      prev.map(c => (c.id === selectedContactId ? { ...c, ...editedContact } as Contact : c))
    );
    setIsEditingProfile(false);
  };

  const createAndSendMessage = (extraFields: Partial<Message> = {}) => {
    if (!selectedContactId) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: 'You',
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      status: 'sent',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      mediaType: 'text',
      ...extraFields
    };

    setMessagesData(prev => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] || []), newMessage]
    }));

    setMessageInput('');
    setShowEmojiPicker(false);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    createAndSendMessage();
  };

  // Feature 1: File Attachments
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContactId) return;

    const fileUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');

    createAndSendMessage({
      content: isImage ? '' : file.name,
      mediaType: isImage ? 'image' : 'file',
      mediaUrl: fileUrl,
      fileName: file.name
    });

    e.target.value = '';
  };

  // Feature 3: Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        createAndSendMessage({
          content: '',
          mediaType: 'audio',
          mediaUrl: audioUrl
        });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or not supported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Feature 4: Emoji Select
  const handleAddEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  // Feature 5: Delete Message
  const handleDeleteMessage = (messageId: number) => {
    if (!selectedContactId) return;
    setMessagesData(prev => ({
      ...prev,
      [selectedContactId]: prev[selectedContactId].filter(msg => msg.id !== messageId)
    }));
    setActiveMenuMessageId(null);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;

    const initials = newMember.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const createdContact: Contact = {
      id: Date.now(),
      name: newMember.name,
      avatar: initials || 'N',
      avatarType: 'text',
      preview: 'New chat initiated...',
      time: 'Just now',
      online: true,
      category: newMember.category,
      email: newMember.email,
      phone: newMember.phone,
      brandType: newMember.brandType,
      location: newMember.location,
      website: newMember.website,
      clientSince: 'Today'
    };

    setContacts(prev => [createdContact, ...prev]);
    setSelectedContactId(createdContact.id);
    setIsModalOpen(false);
    setNewMember({
      name: '',
      category: 'clients',
      email: '',
      phone: '',
      brandType: '',
      location: '',
      website: ''
    });
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.preview.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'clients') return contact.category === 'clients';
    if (activeTab === 'team') return contact.category === 'team';
    if (activeTab === 'unread') return (contact.unreadCount || 0) > 0;
    return true;
  });

  const currentMessages = selectedContactId ? messagesData[selectedContactId] || [] : [];

  return (
    <div className={styles.appContainer}>
      {/* 1. TOP HEADER (Spans full page width) */}
      <header className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <nav className={styles.breadcrumb}>
            <span>Dashboard</span>
            <span className={styles.separator}>›</span>
            <span className={styles.activePage}>Messages</span>
          </nav>
          <h1 className={styles.navTitle}>Messages</h1>
          <p className={styles.navSubtitle}>Stay connected with your clients and team members.</p>
        </div>

        <div className={styles.headerRight}>
          {/* Expandable Search Bar */}
          <div 
            ref={searchContainerRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: isSearchExpanded ? '#f1f5f9' : 'transparent',
              borderRadius: '20px',
              padding: '2px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: isSearchExpanded ? '1px solid #cbd5e1' : '1px solid transparent',
              overflow: 'hidden'
            }}
          >
            <button 
              className={styles.iconBtn} 
              aria-label="Search"
              onClick={() => {
                if (isSearchExpanded && searchQuery) {
                  setSearchQuery('');
                } else {
                  setIsSearchExpanded(!isSearchExpanded);
                }
              }}
              style={{ border: 'none', background: 'transparent' }}
            >
              {isSearchExpanded && searchQuery ? <X size={16} /> : <Search size={16} />}
            </button>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search team or members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: isSearchExpanded ? '200px' : '0px',
                opacity: isSearchExpanded ? 1 : 0,
                padding: isSearchExpanded ? '6px 12px 6px 4px' : '0px',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '13px',
                color: '#0f172a',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>

          <button className={styles.iconBtn} aria-label="More options"><MoreVertical size={16} /></button>
          <button className={styles.newBtn} onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /><span> Add <span>New</span> Member </span>
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT (3 Columns Below Top Header) */}
      <div className={styles.mainLayout}>
        {/* Left Sidebar */}
        <div className={`${styles.sidebar} ${isMobileChatOpen ? styles.mobileHidden : ''}`}>
          <div className={styles.tabList}>
            <button className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`} onClick={() => setActiveTab('all')}>All</button>
            <button className={`${styles.tab} ${activeTab === 'clients' ? styles.activeTab : ''}`} onClick={() => setActiveTab('clients')}>Clients</button>
            <button className={`${styles.tab} ${activeTab === 'team' ? styles.activeTab : ''}`} onClick={() => setActiveTab('team')}>Team</button>
            <button className={`${styles.tab} ${activeTab === 'unread' ? styles.activeTab : ''}`} onClick={() => setActiveTab('unread')}>Unread (3)</button>
          </div>

          <div className={styles.contactList}>
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                className={`${styles.contactCard} ${selectedContactId === contact.id ? styles.activeContact : ''}`}
                onClick={() => handleSelectContact(contact.id)}
              >
                <div className={styles.avatarWrapper}>
                  {contact.avatarType === 'image' ? (
                    <img src={contact.avatar} alt={contact.name} className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>{contact.avatar}</div>
                  )}
                  {contact.online && <span className={styles.onlineDot}></span>}
                </div>

                <div className={styles.contactDetails}>
                  <div className={styles.contactMeta}>
                    <span className={styles.contactName}>{contact.name}</span>
                    <span className={styles.contactTime}>{contact.time}</span>
                  </div>
                  <div className={styles.previewMeta}>
                    <span className={styles.contactPreview}>{contact.preview}</span>
                    {contact.unreadCount && (
                      <span className={styles.badge}>{contact.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Chat Window */}
        <div className={`${styles.chatWindow} ${!isMobileChatOpen ? styles.mobileHidden : ''}`} style={{ position: 'relative' }}>
          {selectedContact ? (
            <>
              {/* Chat Header - Click Profile Area to Open Mobile Drawer */}
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderLeft} onClick={() => setIsMobileProfileOpen(true)} style={{ cursor: 'pointer' }}>
                  <button className={styles.mobileBackBtn} onClick={(e) => { e.stopPropagation(); setIsMobileChatOpen(false); }}>
                    <ChevronLeft size={20} />
                  </button>
                  <div className={styles.avatarWrapper}>
                    {selectedContact.avatarType === 'image' ? (
                      <img src={selectedContact.avatar} alt={selectedContact.name} className={styles.avatarImg} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>{selectedContact.avatar}</div>
                    )}
                  </div>
                  <div className={styles.chatHeaderTitle}>
                    <h2>{selectedContact.name}</h2>
                    <span className={styles.statusText}>● Active now</span>
                  </div>
                </div>

                <div className={styles.chatHeaderActions}>
                  <button className={styles.actionIcon}><Phone size={18} /></button>
                  <button className={styles.actionIcon}><Video size={18} /></button>
                  <button className={styles.actionIcon}><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Chat Stream with Background & Blur overlay when Profile Drawer is Open */}
              <div 
                className={styles.chatStream}
                style={{
                  backgroundImage: `linear-gradient(rgba(240, 238, 233, 0.92), rgba(240, 238, 233, 0.92)), url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '400px',
                  filter: isMobileProfileOpen ? 'blur(4px)' : 'none',
                  transition: 'filter 0.2s ease-in-out'
                }}
              >
                <div className={styles.dateDivider}>
                  <span>Today, 3 Sep 2026</span>
                </div>

                {currentMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`${styles.messageRow} ${msg.isOwn ? styles.ownRow : styles.otherRow}`}
                  >
                    {!msg.isOwn && (
                      <div className={styles.msgAvatarWrapper}>
                        <div className={styles.avatarPlaceholderSmall}>{selectedContact.avatar}</div>
                      </div>
                    )}

                    <div className={styles.msgBody} style={{ position: 'relative' }}>
                      <div className={`${styles.bubble} ${msg.isOwn ? styles.ownBubble : styles.otherBubble}`}>
                        
                        {/* Render Attached Image */}
                        {msg.mediaType === 'image' && (
                          <img src={msg.mediaUrl} alt="Attached image" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '6px' }} />
                        )}

                        {/* Render Attached File */}
                        {msg.mediaType === 'file' && (
                          <a href={msg.mediaUrl} download={msg.fileName} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit', fontWeight: 500, padding: '4px 0' }}>
                            <FileText size={20} />
                            <span>{msg.fileName || 'Download Attachment'}</span>
                          </a>
                        )}

                        {/* Render Voice Audio */}
                        {msg.mediaType === 'audio' && (
                          <audio controls src={msg.mediaUrl} style={{ maxWidth: '240px', height: '40px' }} />
                        )}

                        {/* Render Regular Text Content */}
                        {msg.content && <p>{msg.content}</p>}

                        {/* Message 3-Dots & Delete Option */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id);
                          }}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                        >
                          <MoreVertical size={14} />
                        </button>

                        {activeMenuMessageId === msg.id && (
                          <div style={{ position: 'absolute', top: '24px', right: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, padding: '4px' }}>
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', background: 'none', border: 'none', padding: '6px 12px', width: '100%', cursor: 'pointer', fontSize: '13px' }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className={styles.msgTimeRow}>
                        <span className={styles.msgTime}>{msg.timestamp}</span>
                        {msg.isOwn && <CheckCheck size={14} className={styles.readCheck} />}
                      </div>
                    </div>

                    {msg.isOwn && msg.userAvatar && (
                      <div className={styles.msgAvatarWrapper}>
                        <img src={msg.userAvatar} alt="You" className={styles.userMsgAvatar} />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.mobileFilesStrip}>
                <div className={styles.mobileFilesHeader}>
                  <span>3 Files Shared</span>
                  <a href="#">View All</a>
                </div>
                <div className={styles.mobileFilesList}>
                  <div className={styles.fileChip}>🎨 Homepage_Design_v2.fig</div>
                  <div className={styles.fileChip}>📄 Brand_Guidelines.pdf</div>
                  <div className={styles.fileChip}>📦 Product_Images.zip</div>
                </div>
              </div>

              {/* Input Bar */}
              <div className={styles.inputBarWrapper} style={{ position: 'relative' }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />

                <button className={styles.inputActionBtn} onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={18} />
                </button>

                {showEmojiPicker && (
                  <div style={{ position: 'absolute', bottom: '60px', right: '80px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 20 }}>
                    {EMOJI_LIST.map((emoji, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleAddEmoji(emoji)}
                        style={{ fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {!isRecording ? (
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    className={styles.chatInput}
                  />
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 500, paddingLeft: '12px' }}>
                    <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                    Recording audio... ({recordingTime}s)
                  </div>
                )}

                <button className={styles.inputActionBtn} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <Smile size={18} />
                </button>

                {messageInput.trim().length === 0 ? (
                  !isRecording ? (
                    <button className={styles.inputActionBtn} onClick={startRecording} title="Record Voice Message">
                      <Mic size={18} />
                    </button>
                  ) : (
                    <button className={styles.sendButton} onClick={stopRecording} style={{ background: '#ef4444' }} title="Stop & Send Voice Message">
                      <Square size={16} />
                    </button>
                  )
                ) : (
                  <button className={styles.sendButton} onClick={handleSendMessage}>
                    <Send size={16} />
                  </button>
                )}
              </div>

              {/* Mobile Blurred Overlay Background */}
              {isMobileProfileOpen && (
                <div 
                  onClick={() => setIsMobileProfileOpen(false)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 30
                  }}
                />
              )}
            </>
          ) : (
            <div className={styles.emptyState}>Select a chat to begin</div>
          )}
        </div>

        {/* Right Details Sidebar & Mobile Slide-Over Drawer with Editable Profile */}
        {selectedContact && (
          <div className={`${styles.detailsSidebar} ${isMobileProfileOpen ? styles.mobileProfileVisible : ''}`}>
            {/* Header / Close for Mobile Drawer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>PROFILE DETAILS</span>
              <button 
                onClick={() => setIsMobileProfileOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.detailsProfileHeader}>
              <div className={styles.largeAvatar}>
                <div className={styles.avatarPlaceholderLarge}>{selectedContact.avatar}</div>
              </div>
              
              {!isEditingProfile ? (
                <>
                  <h2>{selectedContact.name}</h2>
                  <p className={styles.activeStatusText}>● Active now</p>
                  <p className={styles.subtext}>Client • Since {selectedContact.clientSince || '12 Jan 2026'}</p>
                </>
              ) : (
                <div style={{ width: '100%', marginTop: '8px' }}>
                  <input
                    type="text"
                    value={editedContact.name || ''}
                    onChange={e => setEditedContact({ ...editedContact, name: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', textAlign: 'center', fontWeight: 600 }}
                  />
                </div>
              )}
            </div>

            <div className={styles.quickActionRow}>
              <button className={styles.quickBtn}><Phone size={16} /><span>Call</span></button>
              <button className={styles.quickBtn}><Video size={16} /><span>Video</span></button>
              <button className={styles.quickBtn}><Mail size={16} /><span>Email</span></button>
              <button className={styles.quickBtn}><MoreVertical size={16} /><span>More</span></button>
            </div>

            {/* Editable Profile Section */}
            <div className={styles.infoSection}>
              <div className={styles.sectionTitle}>
                <h3>About</h3>
                {!isEditingProfile ? (
                  <button className={styles.linkBtn} onClick={() => setIsEditingProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Edit2 size={12} /> Edit Profile
                  </button>
                ) : (
                  <button className={styles.linkBtn} onClick={handleSaveProfile} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                    <Check size={12} /> Save
                  </button>
                )}
              </div>

              <div className={styles.infoList}>
                {!isEditingProfile ? (
                  <>
                    <div className={styles.infoItem}><Briefcase size={16} /><span>{selectedContact.brandType || 'Skincare Brand'}</span></div>
                    <div className={styles.infoItem}><Mail size={16} /><span>{selectedContact.email || 'contact@pureayus.com'}</span></div>
                    <div className={styles.infoItem}><Phone size={16} /><span>{selectedContact.phone || '+91 98765 43210'}</span></div>
                    <div className={styles.infoItem}><MapPin size={16} /><span>{selectedContact.location || 'Bengaluru, Karnataka'}</span></div>
                    <div className={styles.infoItem}><Globe size={16} /><span>{selectedContact.website || 'www.pureayus.com'}</span></div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Brand / Role</label>
                      <input
                        type="text"
                        value={editedContact.brandType || ''}
                        onChange={e => setEditedContact({ ...editedContact, brandType: e.target.value })}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Email</label>
                      <input
                        type="email"
                        value={editedContact.email || ''}
                        onChange={e => setEditedContact({ ...editedContact, email: e.target.value })}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Phone</label>
                      <input
                        type="text"
                        value={editedContact.phone || ''}
                        onChange={e => setEditedContact({ ...editedContact, phone: e.target.value })}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Location</label>
                      <input
                        type="text"
                        value={editedContact.location || ''}
                        onChange={e => setEditedContact({ ...editedContact, location: e.target.value })}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Website</label>
                      <input
                        type="text"
                        value={editedContact.website || ''}
                        onChange={e => setEditedContact({ ...editedContact, website: e.target.value })}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.infoSection}>
              <div className={styles.sectionTitle}>
                <h3>Recent Files</h3>
                <button className={styles.linkBtn}>View All</button>
              </div>
              <div className={styles.fileList}>
                <div className={styles.fileRow}>
                  <span className={styles.fileIcon}>🎨</span>
                  <div className={styles.fileMeta}>
                    <div className={styles.fileName}>Homepage_Design_v2.fig</div>
                    <div className={styles.fileSub}>2.4 MB • 2 Sep 2026</div>
                  </div>
                  <MoreVertical size={14} className={styles.fileMore} />
                </div>
                <div className={styles.fileRow}>
                  <span className={styles.fileIcon}>📄</span>
                  <div className={styles.fileMeta}>
                    <div className={styles.fileName}>Brand_Guidelines.pdf</div>
                    <div className={styles.fileSub}>1.8 MB • 30 Aug 2026</div>
                  </div>
                  <MoreVertical size={14} className={styles.fileMore} />
                </div>
                <div className={styles.fileRow}>
                  <span className={styles.fileIcon}>📦</span>
                  <div className={styles.fileMeta}>
                    <div className={styles.fileName}>Product_Images.zip</div>
                    <div className={styles.fileSub}>12.6 MB • 28 Aug 2026</div>
                  </div>
                  <MoreVertical size={14} className={styles.fileMore} />
                </div>
              </div>
            </div>

            <div className={styles.infoSection}>
              <div className={styles.sectionTitle}>
                <h3>Shared Projects</h3>
                <button className={styles.linkBtn}>View All</button>
              </div>
              <div className={styles.projectList}>
                <div className={styles.projectRow}>
                  <span>🌿 PureAyus Website</span>
                  <span className={styles.statusBadgeProgress}>● In Progress</span>
                </div>
                <div className={styles.projectRow}>
                  <span>📢 Social Media Campaign</span>
                  <span className={styles.statusBadgeDone}>● Completed</span>
                </div>
              </div>
            </div>

            <div className={styles.infoSection}>
              <div className={styles.sectionTitle}>
                <h3>Notes</h3>
                <button className={styles.linkBtn}>Edit</button>
              </div>
              <div className={styles.notesBox}>
                Prefers clean and natural design with green tones. Focus on product showcase and educational content.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. ADD NEW MEMBER MODAL OVERLAY */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Member</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddMemberSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newMember.name}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    value={newMember.category}
                    onChange={e => setNewMember({ ...newMember, category: e.target.value as 'clients' | 'team' })}
                  >
                    <option value="clients">Client</option>
                    <option value="team">Team Member</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Role / Brand Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Design Lead or Tech Brand"
                    value={newMember.brandType}
                    onChange={e => setNewMember({ ...newMember, brandType: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="alex@company.com"
                    value={newMember.email}
                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={newMember.phone}
                    onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="Mumbai, Maharashtra"
                    value={newMember.location}
                    onChange={e => setNewMember({ ...newMember, location: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Website</label>
                  <input
                    type="text"
                    placeholder="www.company.com"
                    value={newMember.website}
                    onChange={e => setNewMember({ ...newMember, website: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Add & Start Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}