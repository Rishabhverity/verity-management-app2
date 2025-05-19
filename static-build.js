const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the out directory exists
if (!fs.existsSync('./out')) {
  fs.mkdirSync('./out');
}

try {
  console.log('Starting static build process...');
  
  // Create a simple index.html file
  const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verity Management System</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(to right, #4a6cf7, #6a3ef8);
      color: white;
      text-align: center;
    }
    .container {
      max-width: 800px;
      padding: 2rem;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    .button {
      display: inline-block;
      background-color: white;
      color: #4a6cf7;
      padding: 0.8rem 1.5rem;
      border-radius: 0.3rem;
      text-decoration: none;
      font-weight: bold;
      transition: all 0.3s ease;
    }
    .button:hover {
      background-color: #f8f9fa;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Verity Management System</h1>
    <p>A centralized platform for managing training operations, connecting trainers, operations, and accounts departments.</p>
    <a href="https://github.com/Rishabhverity/verity-management-app2" class="button">View on GitHub</a>
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync('./out/index.html', indexHtml);
  console.log('Created static index.html file');
  
  // Create a _redirects file for Netlify
  fs.writeFileSync('./out/_redirects', '/* /index.html 200');
  console.log('Created _redirects file for Netlify');
  
  console.log('Static build completed successfully');
} catch (error) {
  console.error('Error in static build script:', error);
  process.exit(1);
}
