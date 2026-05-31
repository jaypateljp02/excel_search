import fs from 'fs';
// Using native fetch, Blob, FormData provided by Node 18+


const filePath = 'test.xlsx';
const fileBuffer = fs.readFileSync(filePath);
const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

const form = new FormData();
form.append('file', blob, 'test.xlsx');

(async () => {
  try {
    console.log('Uploading test.xlsx...');
    const uploadRes = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'x-upload-password': 'admin1234',
        // Note: fetch will set the correct multipart/form-data boundary automatically.
      },
      body: form,
    });
    const uploadJson = await uploadRes.json();
    console.log('Upload status:', uploadRes.status);
    console.log('Upload response:', uploadJson);

    if (!uploadRes.ok) {
      console.error('Upload failed, aborting search');
      return;
    }

    // Simple search for a known value ("Foo")
    const query = 'Foo';
    console.log('Running search for', query);
    const searchRes = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
    const searchJson = await searchRes.json();
    console.log('Search status:', searchRes.status);
    console.log('Search results:', JSON.stringify(searchJson, null, 2));
  } catch (err) {
    console.error('Error during upload/search:', err);
  }
})();
