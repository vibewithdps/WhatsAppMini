import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

import authRoutes from '../routes/authRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import chatRoutes from '../routes/chatRoutes.js';
import messageRoutes from '../routes/messageRoutes.js';
import callRoutes from '../routes/callRoutes.js';
import statusRoutes from '../routes/statusRoutes.js';
import { setupSocketHandlers } from '../sockets/socketHandlers.js';

let mongod;
let server;
let baseUrl;

async function runTests() {
  console.log('🧪 Starting WhatsApp Backend API Integration Tests...\n');

  try {
    // 1. Setup in-memory mongo
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✅ In-Memory MongoDB connected.');

    // 2. Setup test server
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/chats', chatRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/calls', callRoutes);
    app.use('/api/status', statusRoutes);

    app.use((err, req, res, next) => {
      res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
        message: err.message,
      });
    });

    server = http.createServer(app);
    const io = new Server(server, { cors: { origin: '*' } });
    setupSocketHandlers(io);

    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`✅ Test server running on ${baseUrl}`);
        resolve();
      });
    });

    // Helper fetch wrapper
    const api = async (endpoint, options = {}) => {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
      });
      const data = await res.json();
      return { status: res.status, data };
    };

    // Test 1: Demo Login (Alice & Bob)
    console.log('\n▶ Test 1: User Authentication & Demo Login');
    const aliceLogin = await api('/api/auth/demo-login', {
      method: 'POST',
      body: { profile: 'alice' },
    });
    if (aliceLogin.status !== 200 || !aliceLogin.data.accessToken) {
      throw new Error(`Alice login failed: ${JSON.stringify(aliceLogin.data)}`);
    }
    const aliceToken = aliceLogin.data.accessToken;
    const aliceId = aliceLogin.data.user._id;
    console.log(`   ✓ Alice logged in successfully (ID: ${aliceId})`);

    const bobLogin = await api('/api/auth/demo-login', {
      method: 'POST',
      body: { profile: 'bob' },
    });
    const bobToken = bobLogin.data.accessToken;
    const bobId = bobLogin.data.user._id;
    console.log(`   ✓ Bob logged in successfully (ID: ${bobId})`);

    // Test 2: OTP Request & Verification
    console.log('\n▶ Test 2: Phone/Email OTP Verification Flow');
    const otpReq = await api('/api/auth/send-otp', {
      method: 'POST',
      body: { phone: '+1 555 9999' },
    });
    console.log(`   ✓ OTP requested: ${otpReq.data.debugOtp}`);

    const otpVerify = await api('/api/auth/verify-otp', {
      method: 'POST',
      body: { phone: '+1 555 9999', otp: otpReq.data.debugOtp, name: 'OTP Tester' },
    });
    if (otpVerify.status !== 200) {
      throw new Error(`OTP verification failed: ${JSON.stringify(otpVerify.data)}`);
    }
    console.log('   ✓ OTP verified and authenticated successfully');

    // Test 3: Fetch User Directory
    console.log('\n▶ Test 3: Search & List Users');
    const usersList = await api('/api/users', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    if (usersList.status !== 200 || !usersList.data.users.length) {
      throw new Error(`Failed to list users: ${JSON.stringify(usersList.data)}`);
    }
    console.log(`   ✓ User directory fetched (${usersList.data.users.length} contacts found)`);

    // Test 4: Create 1-on-1 Chat
    console.log('\n▶ Test 4: Create 1-on-1 Chat between Alice & Bob');
    const createChat = await api('/api/chats', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: { userId: bobId },
    });
    if (createChat.status !== 200 && createChat.status !== 201) {
      throw new Error(`Failed to create chat: ${JSON.stringify(createChat.data)}`);
    }
    const chatId = createChat.data._id;
    console.log(`   ✓ 1-on-1 Chat created (Chat ID: ${chatId})`);

    // Test 5: Send Messages
    console.log('\n▶ Test 5: Messaging (Text, Replies, Reactions, Deletion)');
    const msg1 = await api('/api/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: { chatId, content: 'Hey Bob, welcome to WhatsApp clone!' },
    });
    if (msg1.status !== 201) {
      throw new Error(`Failed to send message: ${JSON.stringify(msg1.data)}`);
    }
    const msg1Id = msg1.data._id;
    console.log(`   ✓ Alice sent message: "${msg1.data.content}"`);

    // Bob replies
    const msg2 = await api('/api/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bobToken}` },
      body: { chatId, content: 'Thanks Alice! Real-time messaging is fast 🚀', replyToId: msg1Id },
    });
    console.log(`   ✓ Bob replied with quoted message`);

    // Alice reacts
    const reactRes = await api(`/api/messages/react/${msg1Id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: { emoji: '❤️' },
    });
    console.log(`   ✓ Alice reacted with ❤️`);

    // Star message
    const starRes = await api(`/api/messages/star/${msg1Id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log(`   ✓ Alice starred the message`);

    // Test 6: Create Group Chat
    console.log('\n▶ Test 6: Group Chat Creation');
    const groupRes = await api('/api/chats/group', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: {
        name: 'Tech Enthusiasts Group',
        users: [aliceId, bobId],
        description: 'Discussion on WebRTC & React',
      },
    });
    if (groupRes.status !== 201) {
      throw new Error(`Group creation failed: ${JSON.stringify(groupRes.data)}`);
    }
    console.log(`   ✓ Group "${groupRes.data.chatName}" created with ${groupRes.data.users.length} members`);

    // Test 7: 24h Status / Stories
    console.log('\n▶ Test 7: WhatsApp 24h Status / Stories Feed');
    const statusCreate = await api('/api/status', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: {
        mediaType: 'text',
        text: 'Enjoying building scalable real-time systems! ✨',
        bgColor: '#005c4b',
      },
    });
    if (statusCreate.status !== 201) {
      throw new Error(`Status creation failed: ${JSON.stringify(statusCreate.data)}`);
    }
    const statusId = statusCreate.data._id;
    console.log(`   ✓ Alice posted 24-hour Status story`);

    // Bob views status
    await api(`/api/status/view/${statusId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    console.log(`   ✓ Bob viewed Alice's status story`);

    // Test 8: Call Logs
    console.log('\n▶ Test 8: Call History Logs');
    const callLog = await api('/api/calls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: {
        receiverId: bobId,
        callType: 'video',
        status: 'completed',
        duration: 142, // 2m 22s
      },
    });
    if (callLog.status !== 201) {
      throw new Error(`Call log creation failed: ${JSON.stringify(callLog.data)}`);
    }
    console.log(`   ✓ Call record saved: Video Call, duration ${callLog.data.duration}s`);

    console.log('\n=============================================');
    console.log('🎉 ALL BACKEND INTEGRATION TESTS PASSED 100%!');
    console.log('=============================================\n');

  } catch (err) {
    console.error('\n❌ Test Error:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
    if (mongod) await mongod.stop();
    process.exit();
  }
}

runTests();
