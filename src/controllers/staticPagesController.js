const db = require('../config/db').db;

// Lấy nội dung trang tĩnh theo slug
exports.getPage = (req, res) => {
  const slug = req.params.slug;
  db.get('SELECT * FROM static_pages WHERE slug = ?', [slug], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      const defaultData = {
        slug,
        title: getDefaultTitle(slug),
        content: getDefaultContent(slug)
      };
      return res.json({ success: true, data: defaultData });
    }
    res.json({ success: true, data: row });
  });
};

// Tạo hoặc cập nhật trang tĩnh
exports.createPage = (req, res) => {
  const { slug, title, content } = req.body;
  const query = `INSERT OR REPLACE INTO static_pages (slug, title, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
  db.run(query, [slug, title || getDefaultTitle(slug), content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      success: true, 
      data: { 
        id: this.lastID, 
        slug, 
        title: title || getDefaultTitle(slug), 
        content 
      } 
    });
  });
};

// Cập nhật nội dung trang tĩnh
exports.updatePage = (req, res) => {
  const slug = req.params.slug;
  const { title, content } = req.body;
  const query = `INSERT OR REPLACE INTO static_pages (slug, title, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
  db.run(query, [slug, title || getDefaultTitle(slug), content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      success: true, 
      data: {
        slug,
        title: title || getDefaultTitle(slug),
        content
      }
    });
  });
};

// Hàm helper để lấy tiêu đề mặc định
function getDefaultTitle(slug) {
  const titles = {
    payment: 'Hình thức thanh toán',
    warranty: 'Chính sách bảo hành',
    privacy: 'Chính sách bảo mật',
    return: 'Chính sách đổi trả',
    recruitment: 'Tuyển dụng',
    about: 'Giới thiệu',
    news: 'Tin tức',
    partners: 'Đối tác thương hiệu',
    owner: 'Thông tin chủ sở hữu Website',
    license: 'Giấy phép ủy quyền'
  };
  return titles[slug] || slug;
}

// Hàm helper để lấy nội dung mặc định
function getDefaultContent(slug) {
  const contents = {
    payment: '<h2>Hình thức thanh toán</h2><p>Chúng tôi chấp nhận các hình thức thanh toán sau:</p><ul><li>Tiền mặt</li><li>Chuyển khoản ngân hàng</li><li>Ví điện tử</li></ul>',
    warranty: '<h2>Chính sách bảo hành</h2><p>Chúng tôi cam kết bảo hành:</p><ul><li>Linh kiện chính hãng: 12 tháng</li><li>Dịch vụ sửa chữa: 3 tháng</li></ul>',
    privacy: '<h2>Chính sách bảo mật</h2><p>Thông tin của bạn được bảo mật tuyệt đối:</p><ul><li>Không chia sẻ thông tin cá nhân</li><li>Mã hóa dữ liệu</li></ul>',
    return: '<h2>Chính sách đổi trả</h2><p>Chúng tôi hỗ trợ đổi trả trong các trường hợp:</p><ul><li>Sản phẩm lỗi do nhà sản xuất</li><li>Sản phẩm không đúng mô tả</li></ul>',
    recruitment: '<h2>Tuyển dụng</h2><p>Chúng tôi đang tuyển dụng các vị trí:</p><ul><li>Kỹ thuật viên sửa chữa</li><li>Nhân viên tư vấn</li></ul>',
    about: '<h2>Giới thiệu</h2><p>Chúng tôi là đơn vị chuyên sửa chữa điện thoại uy tín với:</p><ul><li>Đội ngũ kỹ thuật viên chuyên nghiệp</li><li>Trang thiết bị hiện đại</li></ul>',
    news: '<h2>Tin tức</h2><p>Cập nhật tin tức mới nhất về công nghệ và dịch vụ sửa chữa.</p>',
    partners: '<h2>Đối tác thương hiệu</h2><p>Chúng tôi là đối tác ủy quyền của các thương hiệu lớn.</p>',
    owner: '<h2>Thông tin chủ sở hữu Website</h2><p>Thông tin về chủ sở hữu và quản lý website.</p>',
    license: '<h2>Giấy phép ủy quyền</h2><p>Thông tin về các giấy phép và chứng chỉ hoạt động.</p>'
  };
  return contents[slug] || '<p>Nội dung đang được cập nhật...</p>';
} 