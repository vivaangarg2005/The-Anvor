





const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/authMiddleware');


router.use(requireAuth);






router.post('/photo', profileController.uploadMiddleware, profileController.uploadPhoto);





router.delete('/photo', profileController.deletePhoto);

module.exports = router;
