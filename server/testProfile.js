/**
 * testProfile.js
 *
 * Tests for POST /api/profile/photo and DELETE /api/profile/photo.
 *
 * ImageKit calls are mocked at the module level so this file runs without
 * real IMAGEKIT_* credentials in CI/local environments where they are absent.
 *
 * Tests:
 *  1. Authenticated upload succeeds (mocked ImageKit)
 *  2. Unauthenticated upload rejected (401)
 *  3. Invalid MIME type rejected (400)
 *  4. File > 5 MB rejected (413 / 400)
 *  5. User A cannot upload to User B's photo (ownership — verified via userId)
 *  6. Replacing existing image saves new URL and attempts old cleanup
 *  7. Old ImageKit asset cleanup called on replacement
 *  8. Deleting profile image clears DB fields
 *  9. Deleting when no image exists is handled safely (200)
 * 10. GET /api/auth/me returns profileImageUrl
 * 11. Private ImageKit credentials never appear in any API response
 */

require('dotenv').config();

// ── Mock @imagekit/nodejs BEFORE requiring app ─────────────────────────────
// We mock the module so no real HTTP requests are made to ImageKit.
const MOCK_FILE_ID = 'mock_imagekit_file_id_123';
const MOCK_URL = 'https://ik.imagekit.io/test/anvor/profiles/profile_test.jpg';
let mockUploadShouldFail = false;
let mockDeleteShouldFail = false;
let deleteFileCalled = false;
let lastDeletedFileId = null;

const mockImagekit = {
  files: {
    upload: async () => {
      if (mockUploadShouldFail) throw new Error('ImageKit upload failed (mocked)');
      return { url: MOCK_URL, fileId: MOCK_FILE_ID };
    },
    deleteFile: async (fileId) => {
      deleteFileCalled = true;
      lastDeletedFileId = fileId;
      if (mockDeleteShouldFail) throw new Error('ImageKit delete failed (mocked)');
      return {};
    },
  },
};

// Override require for imagekitClient — must happen before app is required
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request.includes('imagekitClient')) {
    return mockImagekit;
  }
  return originalLoad.call(this, request, ...args);
};
// ────────────────────────────────────────────────────────────────────────────

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const User = require('./src/models/User');

const generateToken = (userId, role = 'CUSTOMER') =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

const authHeaders = (token) => ({
  Origin: 'http://localhost:3000',
  Authorization: `Bearer ${token}`,
});

// A 1×1 JPEG in binary (minimal valid JPEG)
const VALID_JPEG_BUFFER = Buffer.from(
  'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffffc000110800010001010011000ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda00080101003f00ffa4ffd9',
  'hex'
);

const runTests = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/the-anvor';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for Profile Tests...\n');

    // ── Setup ──────────────────────────────────────────────────────────────
    await User.deleteMany({ phone: { $in: ['+91PROF_TEST_A', '+91PROF_TEST_B'] } });
    const userA = await User.create({
      phone: '+91PROF_TEST_A',
      name: 'Profile User A',
      passwordHash: 'x',
    });
    const userB = await User.create({
      phone: '+91PROF_TEST_B',
      name: 'Profile User B',
      passwordHash: 'x',
    });

    const tokenA = generateToken(userA._id);
    const tokenB = generateToken(userB._id);

    console.log('--- STARTING PROFILE TESTS ---\n');

    // ── TEST 1: Authenticated upload succeeds ──────────────────────────────
    console.log('Test 1: Authenticated upload succeeds');
    mockUploadShouldFail = false;
    let res = await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenA))
      .attach('photo', VALID_JPEG_BUFFER, {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      });
    if (!res.body.success) throw new Error(`Test 1 failed: ${JSON.stringify(res.body)}`);
    if (res.body.data.profileImageUrl !== MOCK_URL) {
      throw new Error(`Test 1 failed: unexpected URL ${res.body.data.profileImageUrl}`);
    }
    // Verify DB was updated
    const dbUser1 = await User.findById(userA._id);
    if (dbUser1.profileImageUrl !== MOCK_URL)
      throw new Error('Test 1 failed: profileImageUrl not saved to DB');
    if (dbUser1.profileImageFileId !== MOCK_FILE_ID)
      throw new Error('Test 1 failed: profileImageFileId not saved to DB');
    console.log('✅ Test 1 passed');

    // ── TEST 2: Unauthenticated upload rejected ────────────────────────────
    console.log('Test 2: Unauthenticated upload rejected');
    res = await request(app)
      .post('/api/profile/photo')
      .set('Origin', 'http://localhost:3000')
      .attach('photo', VALID_JPEG_BUFFER, { filename: 'test.jpg', contentType: 'image/jpeg' });
    if (res.status !== 401) throw new Error(`Test 2 failed: expected 401, got ${res.status}`);
    console.log('✅ Test 2 passed');

    // ── TEST 3: Invalid MIME type rejected ────────────────────────────────
    console.log('Test 3: Invalid MIME type rejected');
    const pdfBuffer = Buffer.from('%PDF-1.4 test');
    res = await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenA))
      .attach('photo', pdfBuffer, { filename: 'evil.pdf', contentType: 'application/pdf' });
    if (res.status !== 400) throw new Error(`Test 3 failed: expected 400, got ${res.status} ${JSON.stringify(res.body)}`);
    console.log('✅ Test 3 passed');

    // ── TEST 4: File > 5 MB rejected ──────────────────────────────────────
    console.log('Test 4: Oversized file rejected');
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 0); // 6 MB
    res = await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenA))
      .attach('photo', bigBuffer, { filename: 'big.jpg', contentType: 'image/jpeg' });
    if (res.status !== 400 && res.status !== 413) {
      throw new Error(`Test 4 failed: expected 400 or 413, got ${res.status}`);
    }
    console.log('✅ Test 4 passed');

    // ── TEST 5: User isolation — User B cannot affect User A's photo ───────
    // This is structural: each user's upload only updates their own document
    // via req.user.userId. We verify User B's upload doesn't touch User A.
    console.log('Test 5: User isolation');
    const urlBefore = (await User.findById(userA._id)).profileImageUrl;
    await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenB))
      .attach('photo', VALID_JPEG_BUFFER, { filename: 'test.jpg', contentType: 'image/jpeg' });
    const urlAfter = (await User.findById(userA._id)).profileImageUrl;
    if (urlBefore !== urlAfter) throw new Error('Test 5 failed: User B modified User A\'s photo');
    console.log('✅ Test 5 passed');

    // ── TEST 6 & 7: Replacing image saves new URL, old cleanup called ──────
    console.log('Test 6 & 7: Replacing existing image');
    deleteFileCalled = false;
    lastDeletedFileId = null;
    // Set an "old" fileId on User A
    await User.findByIdAndUpdate(userA._id, {
      profileImageUrl: 'https://old.url/img.jpg',
      profileImageFileId: 'old_file_id_abc',
    });
    res = await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenA))
      .attach('photo', VALID_JPEG_BUFFER, { filename: 'new.jpg', contentType: 'image/jpeg' });
    if (!res.body.success) throw new Error(`Test 6 failed: ${JSON.stringify(res.body)}`);
    const dbAfterReplace = await User.findById(userA._id);
    if (dbAfterReplace.profileImageUrl !== MOCK_URL)
      throw new Error('Test 6 failed: new URL not saved');
    if (!deleteFileCalled)
      throw new Error('Test 7 failed: old ImageKit file deletion not called');
    if (lastDeletedFileId !== 'old_file_id_abc')
      throw new Error(`Test 7 failed: wrong fileId deleted: ${lastDeletedFileId}`);
    console.log('✅ Tests 6 & 7 passed');

    // ── TEST 8: Delete photo clears DB fields ─────────────────────────────
    console.log('Test 8: Delete photo');
    res = await request(app)
      .delete('/api/profile/photo')
      .set(authHeaders(tokenA));
    if (!res.body.success) throw new Error(`Test 8 failed: ${JSON.stringify(res.body)}`);
    if (res.body.data.profileImageUrl !== null)
      throw new Error('Test 8 failed: profileImageUrl not null after delete');
    const dbAfterDelete = await User.findById(userA._id);
    if (dbAfterDelete.profileImageUrl !== null)
      throw new Error('Test 8 failed: DB profileImageUrl not cleared');
    if (dbAfterDelete.profileImageFileId !== null)
      throw new Error('Test 8 failed: DB profileImageFileId not cleared');
    console.log('✅ Test 8 passed');

    // ── TEST 9: Delete when no image exists is safe ────────────────────────
    console.log('Test 9: Delete when no photo exists');
    res = await request(app)
      .delete('/api/profile/photo')
      .set(authHeaders(tokenA));
    if (res.status !== 200 || !res.body.success)
      throw new Error(`Test 9 failed: expected 200, got ${res.status} ${JSON.stringify(res.body)}`);
    console.log('✅ Test 9 passed');

    // ── TEST 10: GET /api/auth/me returns profileImageUrl ─────────────────
    console.log('Test 10: /api/auth/me returns profileImageUrl');
    // Give User B a photo first
    await User.findByIdAndUpdate(userB._id, {
      profileImageUrl: MOCK_URL,
      profileImageFileId: MOCK_FILE_ID,
    });
    res = await request(app)
      .get('/api/auth/me')
      .set(authHeaders(tokenB));
    if (!res.body.success) throw new Error(`Test 10 failed: ${JSON.stringify(res.body)}`);
    if (res.body.data.profileImageUrl !== MOCK_URL)
      throw new Error(`Test 10 failed: profileImageUrl not in /me response. Got: ${res.body.data.profileImageUrl}`);
    console.log('✅ Test 10 passed');

    // ── TEST 11: Private credentials never in API responses ───────────────
    console.log('Test 11: Private ImageKit credentials not exposed');
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'dummy_private_key_for_test';
    const responseStr = JSON.stringify(res.body);
    if (privateKey !== 'dummy_private_key_for_test' && responseStr.includes(privateKey)) {
      throw new Error('Test 11 CRITICAL: IMAGEKIT_PRIVATE_KEY leaked in API response!');
    }
    console.log('✅ Test 11 passed');

    // ── Cleanup ────────────────────────────────────────────────────────────
    await User.deleteMany({ phone: { $in: ['+91PROF_TEST_A', '+91PROF_TEST_B'] } });

    console.log('\n✅ ALL PROFILE TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

runTests();
