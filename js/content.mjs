import { normalizeText } from './utils.mjs';

export const GLOSSARY = [
  { term: 'gió bụi', meaning: 'Hình ảnh chỉ thời cuộc rối ren, chiến tranh và binh đao.' },
  { term: 'má hồng', meaning: 'Cách gọi văn chương chỉ người phụ nữ trẻ đẹp.' },
  { term: 'truân chuyên', meaning: 'Gian nan, khốn khó, phải trải qua nhiều cảnh éo le.' },
  { term: 'Trường Thành', meaning: 'Vạn Lý Trường Thành; trong văn chương thường gợi miền biên ải và chiến trận.' },
  { term: 'Cam Tuyền', meaning: 'Địa danh cổ được đưa vào điển cảnh chiến tranh và triều đình.' },
  { term: 'áo nhung', meaning: 'Áo quân nhân; ở đây chỉ việc bước vào đời binh nghiệp.' },
  { term: 'niềm tây', meaning: 'Nỗi niềm riêng tư trong lòng.' },
  { term: 'thê noa', meaning: 'Vợ con, gia đình.' },
  { term: 'liên thành', meaning: 'Vật quý giá đến mức được ví với nhiều thành trì; điển tích chỉ giá trị rất lớn.' },
  { term: 'hồng mao', meaning: 'Lông chim hồng; hình ảnh chỉ thứ rất nhẹ, dùng để đối lập với việc lớn.' },
  { term: 'Long Tuyền', meaning: 'Tên một thanh kiếm nổi tiếng trong điển tích, tượng trưng cho khí phách võ tướng.' },
  { term: 'Lâu Lan', meaning: 'Tên nước cổ ở Tây Vực, thường xuất hiện trong thơ chiến trận như một miền biên cương xa xôi.' },
  { term: 'Giới Tử', meaning: 'Giới Tử Thôi/nhân vật điển tích được dùng trong mạch văn cổ; ở đây gợi chí lập công nơi biên tái.' },
  { term: 'quan san', meaning: 'Núi ải, đường xa cách trở.' },
  { term: 'lâm hành', meaning: 'Lúc sắp lên đường.' },
  { term: 'đăng đồ', meaning: 'Lên đường, bắt đầu cuộc hành trình.' },
  { term: 'hồng tiện', meaning: 'Chim hồng nhạn đưa tin; hình ảnh ước lệ về thư từ từ nơi xa.' },
  { term: 'thư phong', meaning: 'Thư được phong kín, thư từ gửi đi xa.' },
  { term: 'hoa đèn', meaning: 'Bấc đèn cháy kết thành hình như hoa; trong quan niệm xưa đôi khi được xem như điềm báo.' },
  { term: 'sắt cầm', meaning: 'Đàn sắt và đàn cầm; biểu tượng cho tình vợ chồng hòa hợp.' },
  { term: 'dây uyên', meaning: 'Hình ảnh gắn với đôi uyên ương, tượng trưng cho tình lứa đôi.' },
  { term: 'phím loan', meaning: 'Hình ảnh văn chương gắn với đàn và tình duyên vợ chồng.' },
  { term: 'gió đông', meaning: 'Gió mùa xuân từ phương đông; ở đây được nhân hóa như phương tiện gửi nỗi nhớ đi xa.' },
  { term: 'non Yên', meaning: 'Miền núi xa nơi biên tái; biểu tượng cho chốn người chinh phu đang ở rất xa.' },
  { term: 'hướng dương', meaning: 'Hướng về phía mặt trời; thường dùng để ví lòng một mực hướng về một người.' }
];

const CURATED_MEANINGS = [
  {
    match: ['nhe troi dat', 'thuo troi dat'],
    meaning: 'Mở đầu bằng cảm giác thời thế đảo điên: chiến tranh đã đẩy cuộc sống bình thường vào cảnh bất an.'
  },
  {
    match: ['khach ma hong'],
    meaning: 'Người phụ nữ phải chịu nhiều gian nan và đau khổ vì cuộc chia lìa do chiến tranh.'
  },
  {
    match: ['xanh kia tham tham'],
    meaning: 'Nàng ngước lên trời cao, như muốn chất vấn một quyền lực vô hình về nguồn cơn của nỗi khổ.'
  },
  {
    match: ['vi ai gay dung'],
    meaning: 'Câu hỏi oán trách: ai đã gây nên chiến tranh và khiến bao gia đình phải chia lìa?'
  },
  {
    match: ['dao hien vang'],
    meaning: 'Nàng đi đi lại lại ngoài hiên vắng trong trạng thái bồn chồn, cô độc và không biết làm gì để khuây khỏa.'
  },
  {
    match: ['ngoai rem thuoc'],
    meaning: 'Nàng mong một dấu hiệu báo tin từ chồng nhưng bên ngoài vẫn hoàn toàn im lặng.'
  },
  {
    match: ['den co biet'],
    meaning: 'Nàng trò chuyện với ngọn đèn như với một người tri kỷ, nhưng cuối cùng vẫn nhận ra mình chỉ có thể tự ôm nỗi buồn.'
  },
  {
    match: ['khac gio dang dang'],
    meaning: 'Thời gian trong cảnh chờ đợi kéo dài nặng nề; một khoảnh khắc cũng có cảm giác dài như cả năm.'
  },
  {
    match: ['long nay gui gio dong'],
    meaning: 'Nàng ước có thể nhờ gió mang tình cảm và nỗi nhớ của mình đến nơi chồng đang ở.'
  },
  {
    match: ['nho chang tham tham'],
    meaning: 'Khoảng cách địa lý được đẩy đến cực độ để diễn tả nỗi nhớ sâu, xa và gần như không thể với tới.'
  }
];

export const CONTEXTS = [
  {
    end: 0.18,
    title: 'Chiến tranh và cuộc tiễn đưa',
    summary: 'Tác phẩm mở ra trong cảnh binh đao. Người chinh phu lên đường vì công danh và việc nước, còn người vợ bước vào một cuộc chia lìa mà nàng không thể kiểm soát.'
  },
  {
    end: 0.38,
    title: 'Khoảng cách ngày một xa',
    summary: 'Sau buổi tiễn đưa, không gian giữa hai người mở rộng thành núi ải, biên cương và những địa danh xa xôi. Nỗi lo cho người đi trận dần lấn át niềm tự hào ban đầu.'
  },
  {
    end: 0.62,
    title: 'Chờ tin trong cô quạnh',
    summary: 'Người chinh phụ sống trong phòng khuê, đếm mùa và chờ thư. Những tín hiệu quen thuộc của đời sống đều trở thành cái cớ để nàng nhớ người đi xa.'
  },
  {
    end: 0.82,
    title: 'Nỗi sầu kéo dài',
    summary: 'Sự chờ đợi làm thời gian như ngưng lại. Nàng mất hứng với trang điểm, nữ công và tiếng đàn; cảnh vật quanh mình cũng nhuốm màu cô độc.'
  },
  {
    end: 1,
    title: 'Khát vọng sum họp',
    summary: 'Ở phần cuối, nỗi nhớ chuyển thành ước mong chiến tranh chấm dứt và vợ chồng được đoàn tụ. Hạnh phúc riêng tư được đặt đối lập với công danh và binh nghiệp.'
  }
];

export function notesForLine(line) {
  const normalizedLine = normalizeText(line);
  const glossary = GLOSSARY.filter(entry => normalizedLine.includes(normalizeText(entry.term)));
  const matched = CURATED_MEANINGS.find(entry => entry.match.some(fragment => normalizedLine.includes(fragment)));
  return {
    glossary,
    meaning: matched?.meaning ?? ''
  };
}

export function contextForLine(index, totalLines) {
  const safeTotal = Math.max(1, totalLines || 1);
  const ratio = Math.min(1, Math.max(0, (index + 1) / safeTotal));
  return CONTEXTS.find(context => ratio <= context.end) ?? CONTEXTS.at(-1);
}
