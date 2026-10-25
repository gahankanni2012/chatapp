import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { AuthModal } from './components/auth/AuthModal';
import { AndroidPhoneWrapper } from './components/android/AndroidPhoneWrapper';
import { AndroidBottomNav, AndroidTab } from './components/android/AndroidBottomNav';
import { AndroidChatsScreen } from './components/android/AndroidChatsScreen';
import { AndroidSquadsScreen } from './components/android/AndroidSquadsScreen';
import { AndroidProfileScreen } from './components/android/AndroidProfileScreen';
import { Sidebar } from './components/chat/Sidebar';
import { GroupSidebar } from './components/chat/GroupSidebar';
import { ChatArea } from './components/chat/ChatArea';
import { MembersList } from './components/chat/MembersList';
import { CreateGroupModal } from './components/chat/CreateGroupModal';
import { JoinGroupModal } from './components/chat/JoinGroupModal';
import { AddChannelModal } from './components/chat/AddChannelModal';
import { InviteFriendsModal } from './components/chat/InviteFriendsModal';
import { DirectMessageModal } from './components/chat/DirectMessageModal';
import { ProfileModal } from './components/chat/ProfileModal';
import { FeaturesModal } from './components/chat/FeaturesModal';
import { AdminConsoleModal } from './components/admin/AdminConsoleModal';
import { FriendRequestsModal } from './components/chat/FriendRequestsModal';
import { useDeviceMode } from './hooks/useDeviceMode';

function ChatDashboard() {
  const { user, isLoading } = useAuth();
  const { activeChat, myGroups, selectChannel, selectDirectChat } = useChat();
  const { isPhone, isLaptop, mode, setPreference } = useDeviceMode();

  // Phone Mode states
  const [androidTab, setAndroidTab] = useState<AndroidTab>('chats');
  const [isInPhoneChat, setIsInPhoneChat] = useState(false);

  // Modals & Panels
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showMembers, setShowMembers] = useState(!isPhone);
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl shadow-[#5e17eb]/40 border-2 border-[#5e17eb]/50 bg-slate-950 flex items-center justify-center p-2 animate-pulse">
            <img src="/logo.svg" alt="KirraK MuchatlU Logo" className="w-full h-full object-contain" />
          </div>
          <p className="text-base font-bold text-white tracking-tight">KirraK MuchatlU</p>
          <p className="text-xs text-slate-400">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return isPhone ? (
      <AndroidPhoneWrapper>
        <AuthModal />
      </AndroidPhoneWrapper>
    ) : (
      <AuthModal />
    );
  }

  const isGroupActive = activeChat.type === 'channel';

  const handleSelectChannel = (groupId: string, channelId: string) => {
    selectChannel(groupId, channelId);
    if (isPhone) {
      setIsInPhoneChat(true);
      setShowMembers(false);
    }
  };

  const handleSelectFriend = (friendId: string) => {
    selectDirectChat(friendId);
    if (isPhone) {
      setIsInPhoneChat(true);
      setShowMembers(false);
    }
  };

  const handleNavigateToFeature = (
    feature: 'createGroup' | 'joinGroup' | 'addChannel' | 'inviteFriends' | 'directMessage' | 'profile' | 'chat'
  ) => {
    switch (feature) {
      case 'createGroup':
        setShowCreateGroup(true);
        break;
      case 'joinGroup':
        setShowJoinGroup(true);
        break;
      case 'addChannel':
        if (myGroups.length > 0) {
          setShowAddChannel(true);
        } else {
          setShowCreateGroup(true);
        }
        break;
      case 'inviteFriends':
        if (myGroups.length > 0) {
          setShowInviteFriends(true);
        } else {
          setShowCreateGroup(true);
        }
        break;
      case 'directMessage':
        setShowDirectMessage(true);
        break;
      case 'profile':
        setShowProfile(true);
        break;
      case 'chat':
        if (myGroups[0] && myGroups[0].channels[0]) {
          handleSelectChannel(myGroups[0].id, myGroups[0].channels[0].id);
        }
        break;
    }
  };

  return (
    <>
      {isPhone ? (
        /* ============================================================ */
        /* 1. PHONE MODE (Android Smartphone Format)                    */
        /* ============================================================ */
        <AndroidPhoneWrapper>
          <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
            {isInPhoneChat ? (
              /* Phone Active Chat View */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <ChatArea
                  showMembers={showMembers}
                  onToggleMembers={() => setShowMembers(!showMembers)}
                  onOpenInviteModal={() => setShowInviteFriends(true)}
                  onOpenFeatures={() => setShowFeatures(true)}
                  onOpenCreateGroup={() => setShowCreateGroup(true)}
                  onOpenJoinGroup={() => setShowJoinGroup(true)}
                  onOpenAddChannel={() => setShowAddChannel(true)}
                  onOpenAdminConsole={() => setShowAdminConsole(true)}
                  onBack={() => setIsInPhoneChat(false)}
                />
              </div>
            ) : (
              /* Phone Bottom Navigation Tabs */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {androidTab === 'chats' && (
                    <AndroidChatsScreen
                      onSelectChannel={handleSelectChannel}
                      onSelectFriend={handleSelectFriend}
                      onOpenCreateGroup={() => setShowCreateGroup(true)}
                      onOpenJoinGroup={() => setShowJoinGroup(true)}
                      onOpenFeatures={() => setShowFeatures(true)}
                      onOpenDirectMessagesModal={() => setShowDirectMessage(true)}
                      onOpenFriendRequests={() => setShowFriendRequests(true)}
                      onOpenAdminConsole={() => setShowAdminConsole(true)}
                    />
                  )}

                  {androidTab === 'squads' && (
                    <AndroidSquadsScreen
                      onOpenCreateGroup={() => setShowCreateGroup(true)}
                      onOpenJoinGroup={() => setShowJoinGroup(true)}
                      onSelectChannel={handleSelectChannel}
                    />
                  )}

                  {androidTab === 'profile' && (
                    <AndroidProfileScreen
                      onOpenEditProfile={() => setShowProfile(true)}
                      onOpenFeatures={() => setShowFeatures(true)}
                      onOpenAdminConsole={() => setShowAdminConsole(true)}
                    />
                  )}
                </div>

                {/* Android Material 3 Bottom Navigation Bar */}
                <AndroidBottomNav
                  currentTab={androidTab}
                  onSelectTab={(tab) => {
                    if (tab === 'create') {
                      setShowCreateGroup(true);
                    } else {
                      setAndroidTab(tab);
                    }
                  }}
                />
              </div>
            )}

            {/* Android Slide-Over Drawer for Members List */}
            {showMembers && isGroupActive && isInPhoneChat && (
              <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
                <div
                  className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
                  onClick={() => setShowMembers(false)}
                />
                <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-right duration-200">
                  <MembersList
                    onClose={() => setShowMembers(false)}
                    onOpenInviteModal={() => setShowInviteFriends(true)}
                    isMobileDrawer
                  />
                </div>
              </div>
            )}
          </div>
        </AndroidPhoneWrapper>
      ) : (
        /* ============================================================ */
        /* 2. LAPTOP MODE (Full Multi-Column Desktop Workstation Format)*/
        /* ============================================================ */
        <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
          {/* Column 1: Left Icon Navigation Rail */}
          <Sidebar
            onOpenCreateGroup={() => setShowCreateGroup(true)}
            onOpenJoinGroup={() => setShowJoinGroup(true)}
            onOpenProfile={() => setShowProfile(true)}
            onOpenDirectMessages={() => setShowDirectMessage(true)}
            onOpenFeatures={() => setShowFeatures(true)}
            onOpenAdminConsole={() => setShowAdminConsole(true)}
            onOpenFriendRequests={() => setShowFriendRequests(true)}
          />

          {/* Column 2: Middle Channels / Friends List */}
          <GroupSidebar
            onOpenAddChannel={() => setShowAddChannel(true)}
            onOpenProfile={() => setShowProfile(true)}
            onOpenDirectMessages={() => setShowDirectMessage(true)}
            onToggleMembers={() => setShowMembers(!showMembers)}
            onOpenFeatures={() => setShowFeatures(true)}
            onOpenFriendRequests={() => setShowFriendRequests(true)}
          />

          {/* Column 3: Main Chat Area */}
          <ChatArea
            showMembers={showMembers}
            onToggleMembers={() => setShowMembers(!showMembers)}
            onOpenInviteModal={() => setShowInviteFriends(true)}
            onOpenFeatures={() => setShowFeatures(true)}
            onOpenCreateGroup={() => setShowCreateGroup(true)}
            onOpenJoinGroup={() => setShowJoinGroup(true)}
            onOpenAddChannel={() => setShowAddChannel(true)}
            onOpenAdminConsole={() => setShowAdminConsole(true)}
          />

          {/* Column 4: Collapsible Right Members List */}
          {showMembers && isGroupActive && (
            <div className="h-full shrink-0">
              <MembersList
                onClose={() => setShowMembers(false)}
                onOpenInviteModal={() => setShowInviteFriends(true)}
              />
            </div>
          )}
        </div>
      )}

      {/* Shared Modals for both Phone and Laptop formats */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />

      <JoinGroupModal
        isOpen={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
      />

      <AddChannelModal
        isOpen={showAddChannel}
        onClose={() => setShowAddChannel(false)}
      />

      <InviteFriendsModal
        isOpen={showInviteFriends}
        onClose={() => setShowInviteFriends(false)}
      />

      <DirectMessageModal
        isOpen={showDirectMessage}
        onClose={() => setShowDirectMessage(false)}
        onSelectFriend={(friendId: string) => {
          setShowDirectMessage(false);
          handleSelectFriend(friendId);
        }}
        onOpenAddFriend={() => setShowFriendRequests(true)}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onOpenAdminConsole={() => setShowAdminConsole(true)}
      />

      <FeaturesModal
        isOpen={showFeatures}
        onClose={() => setShowFeatures(false)}
        onNavigateTo={handleNavigateToFeature}
      />

      <AdminConsoleModal
        isOpen={showAdminConsole}
        onClose={() => setShowAdminConsole(false)}
      />

      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <ChatDashboard />
      </ChatProvider>
    </AuthProvider>
  );
}
