// hashPassword.js
const bcrypt = require('bcrypt');
const password = 'test@123';

bcrypt.hash(password, 10).then((hash) => {
  console.log('Hashed password:', hash);
});

// bcrypt.compare('test@123', '$2a$12$0WDW0TbJQRCpCk/CFl5queQOSzUqeUD7.6lj63qM7cR9tvy8bAzNS')
//   .then(match => console.log('Match:', match));