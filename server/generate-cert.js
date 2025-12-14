const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, 'certs');

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

// Generate private key
execSync('openssl genrsa -out certs/key.pem 2048');

// Generate CSR
execSync('openssl req -new -key certs/key.pem -out certs/csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"');

// Generate self-signed certificate
execSync('openssl x509 -req -days 365 -in certs/csr.pem -signkey certs/key.pem -out certs/cert.pem');

console.log('SSL certificates generated successfully in the certs directory'); 