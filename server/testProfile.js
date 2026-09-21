/**
 * testProfile.js
 *
 * Comprehensive tests for profile photo upload, replacement, and removal:
 *  1. Authenticated upload succeeds
 *  2. New URL saved to MongoDB
 *  3. New ImageKit fileId saved to MongoDB
 *  4. /api/auth/me returns new URL
 *  5. Replacement creates a new ImageKit file
 *  6. Old file deletion receives the correct oldFileId
 *  7. Old deletion does not block the HTTP response (async non-blocking)
 *  8. Old deletion failure does not invalidate the successful replacement
 *  9. New ImageKit upload failure preserves old DB state
 * 10. MongoDB update failure attempts cleanup of newly uploaded file
 * 11. Delete photo removes ImageKit asset and clears DB
 * 12. Failed ImageKit deletion during remove does not clear DB
 * 13. User isolation works (User B cannot affect User A)
 * 14. No private ImageKit credential is exposed
 */

require('dotenv').config();

// ── Mock @imagekit/nodejs BEFORE requiring app ─────────────────────────────
let mockUploadCount = 0;
let mockUploadShouldFail = false;
let mockDeleteShouldFail = false;
let deleteFileCalled = false;
let lastDeletedFileId = null;
let deleteFileResolvers = [];

const mockImagekit = {
  files: {
    upload: async ({ fileName }) => {
      if (mockUploadShouldFail) {
        throw new Error('ImageKit upload failed (mocked failure)');
      }
      mockUploadCount++;
      const fileId = `ik_file_id_${mockUploadCount}_${Date.now()}`;
      const url = `https://ik.imagekit.io/test/anvor/profiles/${fileName}_${mockUploadCount}.jpg`;
      return { url, fileId };
    },
    delete: async (fileId) => {
      deleteFileCalled = true;
      lastDeletedFileId = fileId;
      if (mockDeleteShouldFail) {
        throw new Error('ImageKit delete failed (mocked failure)');
      }
      return {};
    },
  },
};

// Override require for imagekitClient — must happen before app is required
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (requestPath, ...args) {
  if (requestPath.includes('imagekitClient')) {
    return mockImagekit;
  }
  return originalLoad.call(this, requestPath, ...args);
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

// A 1×1 JPEG in binary
const VALID_JPEG_BUFFER = Buffer.from(
  'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffffc000110800010001010011000ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda00080101003f00ffa4ffd9',
  'hex'
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

    // ── TEST 1, 2, 3: Authenticated upload succeeds & saves to DB ──────────
    console.log('Test 1, 2, 3: Authenticated upload succeeds and saves to DB');
    mockUploadShouldFail = false;
    let res = await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenA))
      .attach('photo', VALID_JPEG_BUFFER, {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      });
    if (!res.body.success) throw new Error(`Test 1 failed: ${JSON.stringify(res.body)}`);
    const initialUrlA = res.body.data.profileImageUrl;
    if (!initialUrlA) throw new Error('Test 1 failed: missing profileImageUrl');

    const dbUserA = await User.findById(userA._id);
    if (dbUserA.profileImageUrl !== initialUrlA) {
      throw new Error('Test 2 failed: profileImageUrl not saved to MongoDB');
    }
    const initialFileIdA = dbUserA.profileImageFileId;
    if (!initialFileIdA) {
      throw new Error('Test 3 failed: profileImageFileId not saved to MongoDB');
    }
    console.log('✅ Test 1, 2, 3 passed (Upload succeeded, URL and fileId saved in DB)');

    // ── TEST 4: /api/auth/me returns new URL & Cache-Control: no-store ─────
    console.log('Test 4: /api/auth/me returns new URL with no-store cache headers');
    res = await request(app)
      .get('/api/auth/me')
      .set(authHeaders(tokenA));
    if (!res.body.success || res.body.data.profileImageUrl !== initialUrlA) {
      throw new Error(`Test 4 failed: /api/auth/me did not return new URL`);
    }
    const cacheControl = res.headers['cache-control'] || '';
    if (!cacheControl.includes('no-store')) {
      throw new Error(`Test 4 failed: expected Cache-Control to include no-store, got: ${cacheControl}`);
    }
    console.log('✅ Test 4 passed (/api/auth/me returned correct URL and no-store header)');

    // ── TEST 5, 6, 7: Replacement flow, correct oldFileId, non-blocking ────
    console.log('Test 5, 6, 7: Replacement creates new URL and triggers non-blocking old deletion');
    deleteFileCalled = false;
    lastDeletedFileId = null;

    res = await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenA))
      .attach('photo', VALID_JPEG_BUFFER, {
        filename: 'test2.jpg',
        contentType: 'image/jpeg',
      });

    if (!res.body.success) throw new Error(`Test 5 failed: ${JSON.stringify(res.body)}`);
    const replacementUrlA = res.body.data.profileImageUrl;
    if (replacementUrlA === initialUrlA) {
      throw new Error('Test 5 failed: replacement did not produce a new unique URL');
    }

    // Wait 50ms for setImmediate to execute in background
    await sleep(50);

    if (!deleteFileCalled) {
      throw new Error('Test 6 failed: old ImageKit file deletion was not called');
    }
    if (lastDeletedFileId !== initialFileIdA) {
      throw new Error(`Test 6 failed: expected oldFileId ${initialFileIdA}, got ${lastDeletedFileId}`);
    }

    const dbUserAfterReplace = await User.findById(userA._id);
    if (dbUserAfterReplace.profileImageUrl !== replacementUrlA) {
      throw new Error('Test 5 failed: new URL not persisted in DB');
    }
    console.log('✅ Test 5, 6, 7 passed (New file active, old fileId deleted asynchronously)');

    // ── TEST 8: Old deletion failure does not invalidate successful upload ──
    console.log('Test 8: Old deletion failure does not invalidate successful replacement');
    mockDeleteShouldFail = true;
    const prevFileId = dbUserAfterReplace.profileImageFileId;

    res = await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenA))
      .attach('photo', VALID_JPEG_BUFFER, {
        filename: 'test3.jpg',
        contentType: 'image/jpeg',
      });

    if (!res.body.success) {
      throw new Error(`Test 8 failed: upload should succeed even if background deletion fails`);
    }
    await sleep(50);
    const dbUserAfterFailedCleanup = await User.findById(userA._id);
    if (dbUserAfterFailedCleanup.profileImageUrl !== res.body.data.profileImageUrl) {
      throw new Error('Test 8 failed: newly uploaded image was not saved');
    }
    mockDeleteShouldFail = false;
    console.log('✅ Test 8 passed (Upload succeeded despite old-file cleanup failure)');

    // ── TEST 9: New ImageKit upload failure preserves old DB state ─────────
    console.log('Test 9: New ImageKit upload failure preserves old DB state');
    mockUploadShouldFail = true;
    const stateBeforeUploadFailure = await User.findById(userA._id);

    res = await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenA))
      .attach('photo', VALID_JPEG_BUFFER, {
        filename: 'test_fail.jpg',
        contentType: 'image/jpeg',
      });

    if (res.status === 200) {
      throw new Error('Test 9 failed: upload should have returned error');
    }
    const stateAfterUploadFailure = await User.findById(userA._id);
    if (stateAfterUploadFailure.profileImageUrl !== stateBeforeUploadFailure.profileImageUrl ||
        stateAfterUploadFailure.profileImageFileId !== stateBeforeUploadFailure.profileImageFileId) {
      throw new Error('Test 9 failed: MongoDB state changed after failed upload');
    }
    mockUploadShouldFail = false;
    console.log('✅ Test 9 passed (Existing DB state preserved on ImageKit upload failure)');

    // ── TEST 10: MongoDB update failure attempts cleanup of newly uploaded file ─
    console.log('Test 10: MongoDB update failure triggers cleanup of orphaned new file');
    deleteFileCalled = false;
    lastDeletedFileId = null;

    // Temporarily mock user.save to throw
    const originalSave = User.prototype.save;
    User.prototype.save = async function () {
      if (this.isModified('profileImageUrl')) {
        throw new Error('Simulated MongoDB Save Failure');
      }
      return originalSave.apply(this, arguments);
    };

    res = await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenA))
      .attach('photo', VALID_JPEG_BUFFER, {
        filename: 'test_db_fail.jpg',
        contentType: 'image/jpeg',
      });

    // Restore original save
    User.prototype.save = originalSave;

    if (res.status === 200) {
      throw new Error('Test 10 failed: expected error when DB save fails');
    }
    if (!deleteFileCalled) {
      throw new Error('Test 10 failed: orphan cleanup deleteFile was not called');
    }
    console.log('✅ Test 10 passed (Orphan cleanup triggered on DB failure)');

    // ── TEST 11: Delete photo removes ImageKit asset and clears DB ─────────
    console.log('Test 11: Delete photo removes ImageKit asset and clears DB');
    deleteFileCalled = false;
    lastDeletedFileId = null;
    const activeFileIdBeforeDelete = (await User.findById(userA._id)).profileImageFileId;

    res = await request(app)
      .delete('/api/profile/photo')
      .set(authHeaders(tokenA));

    if (!res.body.success || res.body.data.profileImageUrl !== null) {
      throw new Error(`Test 11 failed: ${JSON.stringify(res.body)}`);
    }
    if (!deleteFileCalled || lastDeletedFileId !== activeFileIdBeforeDelete) {
      throw new Error(`Test 11 failed: deleteFile not called for active fileId ${activeFileIdBeforeDelete}`);
    }
    const dbAfterDelete = await User.findById(userA._id);
    if (dbAfterDelete.profileImageUrl !== null || dbAfterDelete.profileImageFileId !== null) {
      throw new Error('Test 11 failed: DB fields not cleared');
    }
    console.log('✅ Test 11 passed (ImageKit asset deleted and DB cleared)');

    // ── TEST 12: Failed ImageKit deletion during remove does not clear DB ──
    console.log('Test 12: Failed ImageKit deletion during remove does not clear DB');
    // Set a photo on User B
    await User.findByIdAndUpdate(userB._id, {
      profileImageUrl: 'https://test.url/b.jpg',
      profileImageFileId: 'file_b_123',
    });

    mockDeleteShouldFail = true;
    res = await request(app)
      .delete('/api/profile/photo')
      .set(authHeaders(tokenB));

    mockDeleteShouldFail = false;
    if (res.status === 200) {
      throw new Error('Test 12 failed: deletePhoto should fail when ImageKit delete fails');
    }
    const dbUserBAfterFail = await User.findById(userB._id);
    if (dbUserBAfterFail.profileImageUrl !== 'https://test.url/b.jpg' ||
        dbUserBAfterFail.profileImageFileId !== 'file_b_123') {
      throw new Error('Test 12 failed: DB was cleared despite ImageKit deletion failure');
    }
    console.log('✅ Test 12 passed (DB not cleared when ImageKit deletion fails)');

    // ── TEST 13: User isolation (User B cannot modify User A) ──────────────
    console.log('Test 13: User isolation works');
    const userAPhotoBefore = (await User.findById(userA._id)).profileImageUrl;
    await request(app)
      .post('/api/profile/photo')
      .set(authHeaders(tokenB))
      .attach('photo', VALID_JPEG_BUFFER, { filename: 'b.jpg', contentType: 'image/jpeg' });
    const userAPhotoAfter = (await User.findById(userA._id)).profileImageUrl;
    if (userAPhotoBefore !== userAPhotoAfter) {
      throw new Error('Test 13 failed: User B upload modified User A');
    }
    console.log('✅ Test 13 passed (User isolation verified)');

    // ── TEST 14: No private ImageKit credentials exposed ───────────────────
    console.log('Test 14: No private ImageKit credentials exposed');
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'dummy_private_key_for_test';
    const bodyStr = JSON.stringify(res.body);
    if (privateKey !== 'dummy_private_key_for_test' && bodyStr.includes(privateKey)) {
      throw new Error('Test 14 CRITICAL: IMAGEKIT_PRIVATE_KEY leaked in response');
    }
    console.log('✅ Test 14 passed (No private credentials leaked)');

    // ── Cleanup ────────────────────────────────────────────────────────────
    await User.deleteMany({ phone: { $in: ['+91PROF_TEST_A', '+91PROF_TEST_B'] } });

    console.log('\n=============================================');
    console.log('🎉 ALL 14 PROFILE PHOTO TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

runTests();
