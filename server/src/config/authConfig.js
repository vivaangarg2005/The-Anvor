




module.exports = {
  otp: {
    length: 6,                    
    expirationMinutes: 5,         
    maxAttempts: 5,               
    resendCooldownSeconds: 60,    
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',              
  },
  cookie: {
    name: 'anvor_token',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', 
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  },
  password: {
    minLength: 8,
    saltRounds: 12,               
  },
};
