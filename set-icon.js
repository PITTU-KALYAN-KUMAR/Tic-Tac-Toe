const { execSync } = require('child_process');
execSync('npx.cmd react-native set-icon --path logo_padded.png --background "#0B0B1A"', {stdio: 'inherit'});
