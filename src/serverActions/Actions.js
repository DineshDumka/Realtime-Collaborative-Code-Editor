// CommonJS version of Actions for server-side use
const ACTIONS = {
    JOIN: 'join',
    JOINED: 'joined',
    DISCONNECTED: 'disconnected',
    CODE_CHANGE: 'code-change',
    SYNC_CODE: 'sync-code',
    LEAVE: 'leave',
    JOIN_REQUEST: 'join-request',
    JOIN_APPROVED: 'join-approved',
    JOIN_REJECTED: 'join-rejected',
    END_MEETING: 'end-meeting',
    CHAT_MESSAGE: 'chat-message',
    GROUP_MESSAGE: 'group-message',
    SYNC_STDIN: 'sync-stdin'
};

module.exports = ACTIONS;
