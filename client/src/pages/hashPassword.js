// hashPassword.js
const bcrypt = require('bcrypt');
const password ='Pp@Rcf';

bcrypt.hash(password, 10).then((hash) => {
  console.log('Hashed password:', hash);
});

// bcrypt.compare('Admin@123', '$2a$12$0WDW0TbJQRCpCk/CFl5queQOSzUqeUD7.6lj63qM7cR9tvy8bAzNS   $2b$10$zt5WC6/YyJ.swOFUdNnbzuEixi6EDWY5gLPn0rARbFiH.l9yH2dFS')
//   .then(match => console.log('Match:', match));