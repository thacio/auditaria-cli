/**
 * Message management and rendering
 */

import { createChatMessageWithCopy, createChatMessage, updateMessageContent, updateMessageTimestamp, addSpecialContentToMessage } from '../components/MessageComponent.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { processMarkdown } from '../utils/markdown.js';
import { getMessageTypeLabel, getMessageContent, isAIMessage } from '../utils/formatters.js';

export class MessageManager {
    constructor() {
        this.messagesContainer = document.getElementById('messages');
        this.messageCount = 0;
        this.autoScrollEnabled = true;
        
        // Message merging properties
        this.lastAIMessage = null;
        this.mergeTimeframe = 10000; // 10 seconds in milliseconds
        
        // Clear welcome message initially
        this.messagesContainer.innerHTML = '';
    }
    
    /**
     * Add a welcome message
     */
    addWelcomeMessage(text) {
        const messageEl = createChatMessage('info', 'CONNECTION', text);
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    /**
     * Add a system message
     */
    addSystemMessage(text) {
        const messageEl = createChatMessage('info', 'SYSTEM', text);
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    /**
     * Add a history item message
     */
    addHistoryItem(historyItem) {
        // Check if this is converting a pending message to final
        if (historyItem.type === 'gemini' || historyItem.type === 'gemini_content') {
            const pendingTextEl = this.messagesContainer.querySelector('.message-pending-text');
            if (pendingTextEl) {
                if (isAIMessage(historyItem) && this.canMergeWithLast(historyItem)) {
                    pendingTextEl.remove();
                    if (this.mergeWithLastAIMessage(historyItem)) {
                        return;
                    }
                }
                
                // Convert pending text message to final message
                this.convertPendingToFinal(pendingTextEl, historyItem);
                return;
            }
        } else if (historyItem.type === 'tool_group') {
            const pendingToolEl = this.messagesContainer.querySelector('.message-pending-tools');
            if (pendingToolEl) {
                // Convert pending tool group to final tool group
                this.convertPendingToolToFinal(pendingToolEl, historyItem);
                return;
            }
        }
        
        // Check if this AI message can be merged with the last AI message
        if (isAIMessage(historyItem) && this.canMergeWithLast(historyItem)) {
            if (this.mergeWithLastAIMessage(historyItem)) {
                return;
            }
        }
        
        // Regular new message (no pending version exists)
        const messageEl = this.createMessageWithCopy(historyItem);
        
        this.messagesContainer.appendChild(messageEl);
        this.messageCount++;
        this.updateMessageCount();
        this.scrollToBottom();
        
        // Track this message if it's an AI message for potential future merging
        if (isAIMessage(historyItem)) {
            this.lastAIMessage = {
                element: messageEl,
                text: getMessageContent(historyItem),
                timestamp: Date.now(),
                type: historyItem.type
            };
        } else {
            // Clear AI message tracking if this is not an AI message
            this.lastAIMessage = null;
        }
    }
    
    /**
     * Create a message element with copy functionality
     */
    createMessageWithCopy(historyItem) {
        const type = historyItem.type;
        const label = getMessageTypeLabel(type);
        const content = getMessageContent(historyItem);
        
        const copyHandler = (content, format, button) => {
            copyToClipboard(content, format, button, { lastAIMessage: this.lastAIMessage });
        };
        
        return createChatMessageWithCopy(type, label, content, historyItem, copyHandler);
    }
    
    /**
     * Convert pending text message to final
     */
    convertPendingToFinal(pendingTextEl, historyItem) {
        pendingTextEl.classList.remove('message-pending-text');
        
        updateMessageContent(pendingTextEl, getMessageContent(historyItem), historyItem.type);
        updateMessageTimestamp(pendingTextEl);
        
        // Track this converted AI message for potential future merging
        this.lastAIMessage = {
            element: pendingTextEl,
            text: getMessageContent(historyItem),
            timestamp: Date.now(),
            type: historyItem.type
        };
        
        this.messageCount++;
        this.updateMessageCount();
        this.scrollToBottom();
    }
    
    /**
     * Convert pending tool message to final
     */
    convertPendingToolToFinal(pendingToolEl, historyItem) {
        pendingToolEl.classList.remove('message-pending-tools');
        
        // Update with final tool content
        addSpecialContentToMessage(pendingToolEl, historyItem);
        updateMessageTimestamp(pendingToolEl);
        
        this.messageCount++;
        this.updateMessageCount();
        this.scrollToBottom();
    }
    
    /**
     * Update pending item
     */
    updatePendingItem(pendingItem) {
        if (!pendingItem) {
            this.clearPendingToolGroup();
            this.clearPendingTextMessage();
            return;
        }
        
        if (pendingItem.type === 'tool_group') {
            this.updatePendingToolGroup(pendingItem);
        } else {
            this.updatePendingTextMessage(pendingItem);
        }
    }
    
    /**
     * Update pending text message
     */
    updatePendingTextMessage(pendingItem) {
        let pendingMessageEl = this.messagesContainer.querySelector('.message-pending-text');
        
        if (!pendingMessageEl) {
            // Create new pending message element
            pendingMessageEl = this.createMessageWithCopy(pendingItem);
            pendingMessageEl.classList.add('message-pending-text');
            this.messagesContainer.appendChild(pendingMessageEl);
        } else {
            // Update existing pending message content
            updateMessageContent(pendingMessageEl, getMessageContent(pendingItem), pendingItem.type);
            updateMessageTimestamp(pendingMessageEl);
        }
        
        this.scrollToBottom();
    }
    
    /**
     * Update pending tool group
     */
    updatePendingToolGroup(pendingItem) {
        let pendingToolEl = this.messagesContainer.querySelector('.message-pending-tools');
        
        if (!pendingToolEl) {
            // Create new pending tool group element
            pendingToolEl = this.createMessageWithCopy(pendingItem);
            pendingToolEl.classList.add('message-pending-tools');
            this.messagesContainer.appendChild(pendingToolEl);
        } else {
            // Update existing tool group content
            addSpecialContentToMessage(pendingToolEl, pendingItem);
            updateMessageTimestamp(pendingToolEl);
        }
        
        this.scrollToBottom();
    }
    
    /**
     * Clear pending tool group
     */
    clearPendingToolGroup() {
        const pendingToolEl = this.messagesContainer.querySelector('.message-pending-tools');
        if (pendingToolEl) {
            pendingToolEl.remove();
        }
    }
    
    /**
     * Clear pending text message
     */
    clearPendingTextMessage() {
        const pendingTextEl = this.messagesContainer.querySelector('.message-pending-text');
        if (pendingTextEl) {
            pendingTextEl.remove();
        }
    }
    
    /**
     * Check if current message can be merged with the last AI message
     */
    canMergeWithLast(historyItem) {
        if (!this.lastAIMessage || !isAIMessage(historyItem)) {
            return false;
        }
        
        const now = Date.now();
        const timeDiff = now - this.lastAIMessage.timestamp;
        
        return timeDiff <= this.mergeTimeframe;
    }
    
    /**
     * Merge current AI message with the last AI message
     */
    mergeWithLastAIMessage(historyItem) {
        if (!this.lastAIMessage || !this.lastAIMessage.element) {
            return false;
        }
        
        // Get the existing message content
        const contentEl = this.lastAIMessage.element.querySelector('.message-content span');
        if (!contentEl) {
            return false;
        }
        
        // Get current and new content
        const existingContent = this.lastAIMessage.text || '';
        const newContent = getMessageContent(historyItem);
        
        // Combine content with double line break for separation
        const combinedContent = existingContent + '\n\n' + newContent;
        
        // Update the DOM with combined content (apply markdown processing)
        contentEl.innerHTML = processMarkdown(combinedContent);
        
        // Update timestamp
        updateMessageTimestamp(this.lastAIMessage.element);
        
        // Update the lastAIMessage tracking
        this.lastAIMessage.text = combinedContent;
        this.lastAIMessage.timestamp = Date.now();
        
        // Scroll to bottom after merging
        this.scrollToBottom();
        
        return true;
    }
    
    /**
     * Load history items
     */
    loadHistoryItems(historyItems) {
        // Clear welcome message and any pending items when loading history
        this.messagesContainer.innerHTML = '';
        this.messageCount = 0;
        this.lastAIMessage = null;
        
        // Load all historical messages with merging logic
        historyItems.forEach(historyItem => {
            // Check if this AI message can be merged with the last AI message
            if (isAIMessage(historyItem) && this.canMergeWithLast(historyItem)) {
                if (this.mergeWithLastAIMessage(historyItem)) {
                    return;
                }
            }
            
            // Create regular message
            const messageEl = this.createMessageWithCopy(historyItem);
            
            this.messagesContainer.appendChild(messageEl);
            this.messageCount++;
            
            // Track this message if it's an AI message for potential future merging
            if (isAIMessage(historyItem)) {
                this.lastAIMessage = {
                    element: messageEl,
                    text: getMessageContent(historyItem),
                    timestamp: Date.now(),
                    type: historyItem.type
                };
            } else {
                // Clear AI message tracking if this is not an AI message
                this.lastAIMessage = null;
            }
        });
        
        this.updateMessageCount();
        this.scrollToBottom();
    }
    
    /**
     * Clear all messages
     */
    clearAllMessages() {
        this.messagesContainer.innerHTML = '';
        this.messageCount = 0;
        this.lastAIMessage = null;
        this.updateMessageCount();
    }
    
    /**
     * Update message count display
     */
    updateMessageCount() {
        const messageCountElement = document.getElementById('message-count');
        if (messageCountElement) {
            const plural = this.messageCount !== 1 ? 's' : '';
            messageCountElement.textContent = `${this.messageCount} message${plural}`;
        }
    }
    
    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        if (this.autoScrollEnabled) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
    
    /**
     * Toggle auto-scroll functionality
     */
    toggleAutoScroll() {
        this.autoScrollEnabled = !this.autoScrollEnabled;
        
        const autoscrollButton = document.getElementById('autoscroll-button');
        if (autoscrollButton) {
            if (this.autoScrollEnabled) {
                autoscrollButton.classList.add('active');
                autoscrollButton.title = 'Auto-scroll: On';
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            } else {
                autoscrollButton.classList.remove('active');
                autoscrollButton.title = 'Auto-scroll: Off';
            }
        }
    }
    
    /**
     * Get message count
     */
    getMessageCount() {
        return this.messageCount;
    }
}