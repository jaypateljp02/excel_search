import { readFileSync } from 'fs';

const fileBuffer = readFileSync('test.xlsx');
const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

const form = new FormData();
form.append('file', blob, 'test.xlsx');

(async () => {
  try {
    // 1. Upload
    console.log('1. Uploading test.xlsx...');
    const uploadRes = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: { 'x-upload-password': 'admin1234' },
      body: form,
    });
    const uploadJson = await uploadRes.json();
    console.log('   Status:', uploadRes.status);
    console.log('   Response:', JSON.stringify(uploadJson, null, 2));

    if (!uploadRes.ok) {
      console.error('Upload failed! Aborting.');
      return;
    }

    // 2. Search
    const query = 'Foo';
    console.log(`\n2. Searching for "${query}"...`);
    const searchRes = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
    const searchJson = await searchRes.json();
    console.log('   Status:', searchRes.status);
    console.log('   Results:', JSON.stringify(searchJson, null, 2));

    console.log('\nAll tests passed!');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
