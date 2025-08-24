const fs = require('fs');
const path = require('path');

/**
 * Helper script to convert Firebase service account JSON to Base64
 * Usage: 
 *   1. From JSON string: node base64Helper.js --json '{"type":"service_account",...}'
 *   2. From file: node base64Helper.js --file serviceAccountKey.json
 *   3. Interactive: node base64Helper.js
 */

class Base64Helper {
  
  static convertJsonToBase64(jsonString) {
    try {
      // Validate JSON
      JSON.parse(jsonString);
      
      // Convert to Base64
      const base64 = Buffer.from(jsonString, 'utf-8').toString('base64');
      
      return base64;
    } catch (error) {
      throw new Error('Invalid JSON format: ' + error.message);
    }
  }

  static convertFileToBase64(filePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Validate JSON
      JSON.parse(fileContent);
      
      // Convert to Base64
      const base64 = Buffer.from(fileContent, 'utf-8').toString('base64');
      
      return base64;
    } catch (error) {
      throw new Error('Error reading file: ' + error.message);
    }
  }

  static convertBase64ToJson(base64String) {
    try {
      const jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
      const jsonObj = JSON.parse(jsonString);
      
      return {
        jsonString: jsonString,
        jsonObject: jsonObj
      };
    } catch (error) {
      throw new Error('Error decoding Base64 or invalid JSON: ' + error.message);
    }
  }

  static async interactive() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

    try {
      console.log('🔧 Firebase Service Account Base64 Converter\n');
      
      const choice = await question(
        'Choose conversion type:\n' +
        '1. JSON string to Base64\n' +
        '2. JSON file to Base64\n' +
        '3. Base64 to JSON (verify)\n' +
        'Enter choice (1-3): '
      );

      switch (choice.trim()) {
        case '1':
          const jsonString = await question('Enter Firebase service account JSON: ');
          const base64FromString = this.convertJsonToBase64(jsonString);
          console.log('\n✅ Base64 result:');
          console.log(base64FromString);
          console.log('\n📝 Add this to your .env file:');
          console.log(`FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=${base64FromString}`);
          break;

        case '2':
          const filePath = await question('Enter path to JSON file: ');
          const base64FromFile = this.convertFileToBase64(filePath);
          console.log('\n✅ Base64 result:');
          console.log(base64FromFile);
          console.log('\n📝 Add this to your .env file:');
          console.log(`FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=${base64FromFile}`);
          break;

        case '3':
          const base64Input = await question('Enter Base64 string to verify: ');
          const decoded = this.convertBase64ToJson(base64Input);
          console.log('\n✅ Decoded JSON:');
          console.log(JSON.stringify(decoded.jsonObject, null, 2));
          console.log('\n✅ Project ID:', decoded.jsonObject.project_id);
          console.log('✅ Client Email:', decoded.jsonObject.client_email);
          break;

        default:
          console.log('❌ Invalid choice');
          break;
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      rl.close();
    }
  }

  static main() {
    const args = process.argv.slice(2);
    
    try {
      if (args.length === 0) {
        // Interactive mode
        this.interactive();
        return;
      }

      if (args[0] === '--json' && args[1]) {
        // JSON string mode
        const base64 = this.convertJsonToBase64(args[1]);
        console.log('✅ Base64 result:');
        console.log(base64);
        console.log('\n📝 Add this to your .env file:');
        console.log(`FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=${base64}`);
      } else if (args[0] === '--file' && args[1]) {
        // File mode
        const base64 = this.convertFileToBase64(args[1]);
        console.log('✅ Base64 result:');
        console.log(base64);
        console.log('\n📝 Add this to your .env file:');
        console.log(`FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=${base64}`);
      } else if (args[0] === '--decode' && args[1]) {
        // Decode mode
        const decoded = this.convertBase64ToJson(args[1]);
        console.log('✅ Decoded JSON:');
        console.log(JSON.stringify(decoded.jsonObject, null, 2));
      } else {
        console.log('❌ Invalid arguments');
        console.log('Usage:');
        console.log('  node base64Helper.js --json \'{"type":"service_account",...}\'');
        console.log('  node base64Helper.js --file serviceAccountKey.json');
        console.log('  node base64Helper.js --decode <base64_string>');
        console.log('  node base64Helper.js (interactive mode)');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run if this file is executed directly
if (require.main === module) {
  Base64Helper.main();
}

module.exports = Base64Helper;
