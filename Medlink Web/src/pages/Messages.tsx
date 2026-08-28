import React, { useState, useEffect, useMemo } from "react";
import { MessageSquare, Send, Search, Users, Phone, Mail, Building2, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { Message, User } from "../types";
import { subscribeMessages, markMessagesAsRead } from "../firebase/firestoreService";
import { AvailabilityBadge } from "../components/AvailabilityBadge";

interface MessagesProps {
  onSelectDoctorDetails?: (doctor: User) => void;
}

export const Messages: React.FC<MessagesProps> = ({ onSelectDoctorDetails }) => {
  const { user } = useAuth();
  const { chatRooms, sendDirectMessage, doctors, getOrCreateChatRoom } = useData();

  const [activeTab, setActiveTab] = useState<"chats" | "doctors">("chats");
  const [activeRoomId, setActiveRoomId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  // Set initial active room when rooms load
  useEffect(() => {
    if (activeTab === "chats" && chatRooms.length > 0 && (!activeRoomId || !chatRooms.some((r) => r.id === activeRoomId))) {
      setActiveRoomId(chatRooms[0].id);
    }
  }, [chatRooms, activeRoomId, activeTab]);

  const currentRoom = chatRooms.find((r) => r.id === activeRoomId);

  // Subscribe to real-time messages for active room
  useEffect(() => {
    if (!currentRoom || activeTab !== "chats") return;
    const unsub = subscribeMessages(currentRoom.id, (msgs) => {
      setMessages(msgs);
    });

    const peerUid = currentRoom.participants?.find((id) => id !== user.id) || "";
    if (peerUid) {
      markMessagesAsRead(user.id, peerUid);
    }

    return () => unsub();
  }, [currentRoom, user.id, activeTab]);

  // Get peer info
  const peerUid = currentRoom?.participants?.find((id) => id !== user.id) || currentRoom?.participantUids?.find((id) => id !== user.id) || "";
  const peerDoc = doctors.find((d) => d.id === peerUid || d.uid === peerUid);
  const peerName = peerDoc?.name || peerDoc?.fullName || currentRoom?.participantNames?.[peerUid] || "Colleague Doctor";
  const peerPhoto = peerDoc?.avatarUrl || peerDoc?.photoUrl || currentRoom?.participantPhotos?.[peerUid] || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400";

  const filteredRooms = useMemo(() => chatRooms.filter((room) => {
    const pUid = room.participants?.find((id) => id !== user.id) || room.participantUids?.find((id) => id !== user.id) || "";
    const pDoc = doctors.find((d) => d.id === pUid || d.uid === pUid);
    const pName = pDoc?.name || pDoc?.fullName || room.participantNames?.[pUid] || "";
    return pName.toLowerCase().includes(searchQuery.toLowerCase());
  }), [chatRooms, doctors, user.id, searchQuery]);

  const allDoctors = useMemo(() => doctors.filter((doc) => doc.id !== user.id && doc.uid !== user.id), [doctors, user.id]);
  const filteredDoctors = useMemo(() => allDoctors.filter((doc) => {
    const dName = doc.name || doc.fullName || "";
    return dName.toLowerCase().includes(searchQuery.toLowerCase());
  }), [allDoctors, searchQuery]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !peerUid) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      await sendDirectMessage(peerUid, textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickTemplate = (template: string) => {
    setInputText(template);
  };

  const handleStartChat = async (peer: User) => {
    try {
      const room = await getOrCreateChatRoom(peer);
      setActiveRoomId(room.id);
      setActiveTab("chats");
    } catch (err) {
      console.error("Failed to start chat", err);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden h-[calc(100vh-180px)] flex flex-col md:flex-row animate-in fade-in duration-300">
      {/* Left Panel */}
      <div className="w-full md:w-80 border-r border-slate-200/80 flex flex-col shrink-0 bg-slate-50/50">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            {activeTab === "chats" ? (
              <MessageSquare className="w-4 h-4 text-sky-600" />
            ) : (
              <Users className="w-4 h-4 text-sky-600" />
            )}
            <span>{activeTab === "chats" ? "Peer Direct Messages" : "Doctor Directory"}</span>
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md">
            {activeTab === "chats" ? chatRooms.length : allDoctors.length}
          </span>
        </div>

        {/* Tabs */}
        <div className="p-3 bg-white">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === "chats"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              My Chats
            </button>
            <button
              onClick={() => setActiveTab("doctors")}
              className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === "doctors"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All Doctors
            </button>
          </div>
        </div>

        <div className="px-3 pb-3 bg-white border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "chats" ? "Search conversations..." : "Search doctors..."}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {activeTab === "chats" ? (
            chatRooms.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-500">No active conversations. Check the All Doctors tab to start a new chat.</p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const roomPeerUid = room.participants?.find((id) => id !== user.id) || room.participantUids?.find((id) => id !== user.id) || "";
                const roomPeerDoc = doctors.find((d) => d.id === roomPeerUid || d.uid === roomPeerUid);
                const name = roomPeerDoc?.name || roomPeerDoc?.fullName || room.participantNames?.[roomPeerUid] || "Doctor";
                const photo = roomPeerDoc?.avatarUrl || roomPeerDoc?.photoUrl || room.participantPhotos?.[roomPeerUid] || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400";
                const isActive = room.id === currentRoom?.id;
                const unreadCount = room.unreadCounts?.[user.id] || 0;

                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isActive ? "bg-sky-50/80 border-l-4 border-sky-600" : "hover:bg-slate-100/80"
                    }`}
                  >
                    <img
                      src={photo}
                      alt={name}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (roomPeerDoc && onSelectDoctorDetails) onSelectDoctorDetails(roomPeerDoc);
                      }}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer hover:opacity-80"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h4 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (roomPeerDoc && onSelectDoctorDetails) onSelectDoctorDetails(roomPeerDoc);
                          }}
                          className="text-xs font-bold text-slate-900 truncate hover:text-sky-700 cursor-pointer"
                        >
                          {name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {room.lastMessageTimestamp
                            ? new Date(room.lastMessageTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-slate-500 truncate">{room.lastMessage}</p>
                        {unreadCount > 0 && (
                          <span className="ml-1 text-[9px] font-bold bg-sky-600 text-white rounded-full px-1.5 py-0.2">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          ) : (
            filteredDoctors.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-500">No other doctors found in the network.</p>
              </div>
            ) : (
              filteredDoctors.map((doc) => {
                const docName = doc.name || doc.fullName || "Doctor";
                const docPhoto = doc.avatarUrl || doc.photoUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(docName);
                const isAvail = doc.clinicStatus === "Available" || doc.isAvailableForCoverage;

                return (
                  <div key={doc.id || doc.uid} className="w-full p-3.5 flex flex-col gap-2 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <img
                        src={docPhoto}
                        alt={docName}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectDoctorDetails) onSelectDoctorDetails(doc);
                        }}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer hover:opacity-80"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectDoctorDetails) onSelectDoctorDetails(doc);
                          }}
                          className="text-xs font-bold text-slate-900 truncate cursor-pointer hover:text-sky-700"
                        >
                          {docName}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{doc.specialty || "General Medicine"}</p>
                        <div className="mt-1">
                          <AvailabilityBadge isAvailable={isAvail} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleStartChat(doc)}
                        className="flex-1 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 text-[10px] font-bold shadow-xs transition-colors cursor-pointer text-center"
                      >
                        Message
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Right Active Chat View */}
      {activeTab === "chats" && currentRoom ? (
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Chat Room Top Bar */}
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <img
                src={peerPhoto}
                alt={peerName}
                onClick={() => peerDoc && onSelectDoctorDetails && onSelectDoctorDetails(peerDoc)}
                className="w-10 h-10 rounded-xl object-cover border border-sky-200 cursor-pointer hover:opacity-80"
              />
              <div>
                <h3 
                  onClick={() => peerDoc && onSelectDoctorDetails && onSelectDoctorDetails(peerDoc)}
                  className="text-sm font-bold text-slate-900 cursor-pointer hover:text-sky-700"
                >
                  {peerName}
                </h3>
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Real-time Connected • Firestore Chat
                </p>
              </div>
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">
                No messages yet. Send a message to start conversation with {peerName}.
              </p>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === user.id || msg.senderUid === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${isMine ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isMine
                          ? "bg-sky-600 text-white rounded-br-xs"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Shift Swap Templates */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 px-2">
              Quick Prompts:
            </span>
            <button
              type="button"
              onClick={() => handleQuickTemplate("Hi Dr., can you cover my upcoming shift? I can swap duties for you.")}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-300 text-[11px] font-medium text-slate-700 whitespace-nowrap cursor-pointer"
            >
              Request Shift Swap
            </button>
            <button
              type="button"
              onClick={() => handleQuickTemplate("Thank you for approving the coverage offer. Ward handover notes are updated.")}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-300 text-[11px] font-medium text-slate-700 whitespace-nowrap cursor-pointer"
            >
              Confirm Handover
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200/80 flex items-center gap-2 bg-white">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${peerName}...`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      ) : activeTab === "doctors" ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
          <div className="max-w-md text-center space-y-4">
            <Users className="w-16 h-16 text-slate-300 mx-auto" />
            <h2 className="text-xl font-extrabold text-slate-800">Peer Directory</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Browse all registered practitioners on the network. Select a doctor from the list and click "Message" to initialize a real-time secure conversation.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs bg-slate-50/50">
          Select a chat room from the left.
        </div>
      )}
    </div>
  );
};
