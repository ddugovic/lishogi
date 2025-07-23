import { makeChat } from 'chat';

function main(data: any) {
  window.lishogi.socket = new window.lishogi.StrongSocket('/chatroom/socket', data.socketVersion);
  data.chat.withColorTags = true;
  data.chat && makeChat(data.chat);
}

window.lishogi.registerModule(__bundlename__, main);
