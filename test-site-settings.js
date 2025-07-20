const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testSiteSettings() {
  console.log('=== Testing SiteSettings APIs ===\n');

  try {
    // Test 1: GET /api/settings
    console.log('1. Testing GET /api/settings...');
    const settingsResponse = await axios.get(`${BASE_URL}/settings`);
    console.log('✅ Settings API:', settingsResponse.data);
    console.log('');

    // Test 2: PUT /api/settings
    console.log('2. Testing PUT /api/settings...');
    const testSettings = {
      company_name: 'Dr Phone - Sửa chữa điện thoại',
      phone: '0123456789',
      phone_feedback: '0987654321',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      email: 'info@drphone.com',
      facebook: 'https://facebook.com/drphone',
      youtube: 'https://youtube.com/drphone',
      zalo: 'https://zalo.me/drphone',
      tiktok: 'https://tiktok.com/@drphone',
      messenger: 'https://m.me/drphone',
      instagram: 'https://instagram.com/drphone',
      certificates: ['cert1.jpg', 'cert2.jpg']
    };
    
    const updateSettingsResponse = await axios.put(`${BASE_URL}/settings`, testSettings);
    console.log('✅ Update Settings API:', updateSettingsResponse.data);
    console.log('');

    // Test 3: GET /api/static-pages/payment
    console.log('3. Testing GET /api/static-pages/payment...');
    const paymentResponse = await axios.get(`${BASE_URL}/static-pages/payment`);
    console.log('✅ Payment Page API:', paymentResponse.data);
    console.log('');

    // Test 4: PUT /api/static-pages/payment
    console.log('4. Testing PUT /api/static-pages/payment...');
    const updatedContent = '<h2>Hình thức thanh toán cập nhật</h2><p>Chúng tôi chấp nhận các hình thức thanh toán sau:</p><ul><li>Tiền mặt</li><li>Chuyển khoản ngân hàng</li><li>Ví điện tử (MoMo, ZaloPay)</li><li>Thẻ tín dụng</li></ul>';
    
    const updatePaymentResponse = await axios.put(`${BASE_URL}/static-pages/payment`, {
      content: updatedContent
    });
    console.log('✅ Update Payment Page API:', updatePaymentResponse.data);
    console.log('');

    // Test 5: POST /api/upload
    console.log('5. Testing POST /api/upload...');
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    // Tạo file test ảnh
    const testImagePath = './test-image.txt';
    fs.writeFileSync(testImagePath, 'This is a test image file');
    
    form.append('image', fs.createReadStream(testImagePath), {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });
    
    try {
      const uploadResponse = await axios.post(`${BASE_URL}/upload`, form, {
        headers: {
          ...form.getHeaders()
        }
      });
      console.log('✅ Upload API:', uploadResponse.data);
    } catch (uploadError) {
      console.log('❌ Upload API Error:', uploadError.response?.data || uploadError.message);
    }
    
    // Xóa file test
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    console.log('');

    console.log('=== All tests completed! ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSiteSettings(); 