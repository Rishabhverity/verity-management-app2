const { execSync } = require('child_process');
const fs = require('fs');

// Create a logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

// Log file for build output
const logFile = fs.createWriteStream('./logs/build.log', { flags: 'w' });

try {
  console.log('Starting build process...');
  logFile.write('Starting build process...\n');

  // Log environment information
  console.log('Node version:', process.version);
  logFile.write(`Node version: ${process.version}\n`);

  console.log('Listing dependencies...');
  const deps = JSON.parse(fs.readFileSync('./package.json')).dependencies;
  logFile.write(`Dependencies: ${JSON.stringify(deps, null, 2)}\n`);

  // Run the build command with detailed output
  console.log('Running next build...');
  logFile.write('Running next build...\n');
  
  try {
    // Set environment variables to skip checks
    process.env.NEXT_TELEMETRY_DISABLED = '1';
    process.env.SKIP_LINTING = 'true';
    process.env.CI = 'false';
    
    const buildOutput = execSync('next build', { 
      stdio: 'pipe',
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1',
        SKIP_LINTING: 'true',
        CI: 'false'
      }
    }).toString();
    
    console.log(buildOutput);
    logFile.write(`Build output: ${buildOutput}\n`);
    
    console.log('Build completed successfully');
    logFile.write('Build completed successfully\n');
  } catch (buildError) {
    console.error('Build failed:', buildError.message);
    logFile.write(`Build failed: ${buildError.message}\n`);
    if (buildError.stdout) {
      console.error('Build output:', buildError.stdout.toString());
      logFile.write(`Build output: ${buildError.stdout.toString()}\n`);
    }
    if (buildError.stderr) {
      console.error('Build errors:', buildError.stderr.toString());
      logFile.write(`Build errors: ${buildError.stderr.toString()}\n`);
    }
    process.exit(1);
  }
} catch (error) {
  console.error('Error in build script:', error);
  logFile.write(`Error in build script: ${error.toString()}\n`);
  process.exit(1);
} finally {
  logFile.end();
}
