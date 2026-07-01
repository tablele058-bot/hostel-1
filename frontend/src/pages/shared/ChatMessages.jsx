import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiChevronLeft,
  HiPaperAirplane,
  HiTrash,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { chatMessagesStyles as s } from "../../assets/dummyStyles";

const ChatMessages = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchConversations();
  }, [token]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
      scrollToBottom();
    }
  }, [activeChat]);

  useEffect(() => {
    if (activeChat) {
      pollRef.current = setInterval(() => {
        fetchMessages(activeChat._id, true);
      }, 3000);
      return () => clearInterval(pollRef.current);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId, isPoll = false) => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      if (!isPoll) console.error("Failed to fetch messages");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const tempText = newMessage;
    setNewMessage("");

    try {
      await axios.post(
        `${API_URL}/api/chat/${activeChat._id}/messages`,
        { text: tempText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMessages(activeChat._id);
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message");
    }
  };

  const handleDeleteMessage = async (chatId, msgId) => {
    try {
      await axios.delete(
        `${API_URL}/api/chat/${chatId}/messages/${msgId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMessages(chatId);
    } catch (err) {
      console.error("Failed to delete message");
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await axios.delete(`${API_URL}/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activeChat?._id === chatId) setActiveChat(null);
      fetchConversations();
    } catch (err) {
      console.error("Failed to delete chat");
    }
  };

  const getChatPartner = (conversation) => {
    if (!conversation?.participants || !user) return { name: "Unknown" };
    return (
      conversation.participants.find(
        (p) => (p._id || p) !== user._id
      ) || conversation.participants[0]
    );
  };

  const handleSelectChat = (conversation) => {
    setActiveChat(conversation);
    fetchMessages(conversation._id);
  };

  return (
    <div
      className={`${s.chatContainer} ${
        user?.role === "owner" ? s.chatContainerSeller : s.chatContainerNonSeller
      }`}
    >
      <div className={s.chatWrapper}>
        <div
          className={`${s.sidebar} ${
            activeChat ? s.sidebarHidden : ""
          }`}
        >
          <div className={s.sidebarHeader}>
            <h2 className={s.sidebarTitle}>Messages</h2>
          </div>
          <div className={s.sidebarContent}>
            {conversations.length === 0 ? (
              <div className={s.emptyConversations}>
                <HiOutlineChatBubbleLeftRight className={s.emptyIcon} />
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const partner = getChatPartner(conv);
                const lastMsg =
                  conv.lastMessage?.text || "No messages yet";
                const isActive =
                  activeChat?._id === conv._id;

                return (
                  <div
                    key={conv._id}
                    className={`${s.conversationItem} ${
                      isActive ? s.conversationItemActive : ""
                    }`}
                    onClick={() => handleSelectChat(conv)}
                  >
                    <div className={s.avatar}>
                      {partner?.profilePic ? (
                        <img
                          className={s.avatarImg}
                          src={partner.profilePic}
                          alt=""
                        />
                      ) : (
                        (partner?.name || "U").charAt(0)
                      )}
                    </div>
                    <div className={s.conversationInfo}>
                      <div className={s.conversationName}>
                        {partner?.name || "Unknown"}
                      </div>
                      <div className={s.conversationPreview}>
                        {lastMsg}
                      </div>
                    </div>
                    <button
                      className={s.deleteChatButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(conv._id);
                      }}
                      title="Delete conversation"
                    >
                      <HiTrash size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={s.chatArea}>
          {activeChat ? (
            <>
              <div className={s.chatHeader}>
                <div className={s.chatHeaderLeft}>
                  <button
                    className={s.backButton}
                    onClick={() => setActiveChat(null)}
                  >
                    <HiChevronLeft size={24} />
                  </button>
                  <div className={s.avatar}>
                    {getChatPartner(activeChat)?.profilePic ? (
                      <img
                        className={s.avatarImg}
                        src={getChatPartner(activeChat).profilePic}
                        alt=""
                      />
                    ) : (
                      getChatPartner(activeChat)?.name?.charAt(0)
                    )}
                  </div>
                  <div className={s.chatPartnerName}>
                    {getChatPartner(activeChat)?.name}
                  </div>
                </div>
              </div>

              <div className={s.messagesArea}>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`${s.messageBubble} ${
                      (msg.sender?._id || msg.sender) === user._id
                        ? s.messageOwn
                        : s.messageOther
                    }`}
                  >
                    <div className={s.messageContent}>
                      {msg.image && (
                        <div className={s.messageImageWrapper}>
                          <img
                            src={msg.image}
                            alt="Property Reference"
                            className={s.messageImage}
                          />
                        </div>
                      )}
                      <div className={s.messageText}>{msg.text}</div>
                      {(msg.sender?._id || msg.sender) === user._id && (
                        <button
                          className={s.deleteMessageButton}
                          onClick={() =>
                            handleDeleteMessage(activeChat._id, msg._id)
                          }
                          title="Delete Message"
                        >
                          <HiTrash size={14} />
                        </button>
                      )}
                    </div>
                    <span className={s.messageTime}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className={s.messageForm} onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className={s.messageInput}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className={s.sendButton}>
                  <HiPaperAirplane className={s.sendIcon} />
                </button>
              </form>
            </>
          ) : (
            <div className={s.noChatSelected}>
              <HiOutlineChatBubbleLeftRight className={s.noChatIcon} />
              <h3 className={s.noChatTitle}>Your Messages</h3>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;
