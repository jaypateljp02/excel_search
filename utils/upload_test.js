import fs from 'fs';
import path from 'path';

const filePath = path.resolve('test.xlsx');
const fileStream = fs.createReadStream(filePath);

const form = new FormData();
form.append('file', fileStream, 'test.xlsx');

fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  headers: {
    'x-upload-password': 'admin1234',
  },
  body: form,
})
  .then(res => res.json().then(data => ({status: res.status, data})))
  .then(({status, data}) => {
    console.log('Status:', status);
    console.log('Response:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Upload error:', err);
  });
