export const settingsConfig = {
  chats: {
    title: 'Chats',
    sections: [
      {
        title: 'Chat settings',
        items: [
          { title: 'Enter is send', subtitle: 'Enter key will send your message', type: 'toggle', default: false, stateKey: 'enterIsSend' },
        ]
      },
      {
        title: 'Archived chats',
        items: [
          { title: 'Keep chats archived', subtitle: 'Archived chats will remain archived when you receive a new message', type: 'toggle', default: true, stateKey: 'keepChatsArchived' }
        ]
      }
    ]
  },
  appearance: {
    title: 'Appearance',
    sections: [
      {
        title: 'Theme Settings',
        items: [
          { icon: 'Palette', title: 'App theme', subtitle: 'Toggle Light / Dark mode', type: 'link', id: 'app_theme' }
        ]
      }
    ]
  },
  notifications: {
    title: 'Notifications',
    sections: [
      {
        items: [
          { title: 'Conversation tones', subtitle: 'Play sounds for incoming and outgoing messages.', type: 'toggle', default: true, stateKey: 'conversationTones' },
        ]
      }
    ]
  },
  help: {
    title: 'Help',
    sections: [
      {
        items: [
          { icon: 'HelpCircle', title: 'Help center', type: 'link', id: 'help_center' },
          { icon: 'Mail', title: 'Contact us', subtitle: 'Questions? Need help?', type: 'link', id: 'contact_us' },
          { icon: 'Info', title: 'App info', type: 'link', id: 'app_info' }
        ]
      }
    ]
  }
};