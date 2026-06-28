exports.handler = async (event) => {
  // รับรหัสล็อคจาก URL
  const shopId = event.queryStringParameters.shop;
  
  // ลิงก์ดึงข้อมูลจากชีตของบอส
  const gasUrl = "https://script.google.com/macros/s/AKfycbw13qPZkiCxF3vb1ltlg7Cky7H7rSonocdkEAz-TVq_rKrFuXQ5Y-fDJVCUpx1u44c/exec";

  // 1. แอบดึงหน้าเว็บ index.html แบบปกติมารอไว้ก่อน
  const baseUrl = process.env.URL || "https://www.kodangman.shop";
  let html = "";
  try {
     const indexRes = await fetch(baseUrl + "/");
     html = await indexRes.text();
  } catch(e) {
     return { statusCode: 500, body: "Error loading site" };
  }

  // 2. วิ่งไปเช็คข้อมูลรูปร้านใน Google Sheets
  try {
    const res = await fetch(gasUrl);
    const shops = await res.json();
    const targetShop = shops.find(s => s.lock && s.lock.includes(shopId));

    // ถ้าเจอร้านที่รหัสตรงกัน ให้สลับรูปและชื่อหน้าปก!
    if (targetShop) {
      let title = `พิกัดร้าน: ${targetShop.name} (ล็อค ${shopId})`;
      let image = "https://i.postimg.cc/wMVjb074/khe-ywx-xn.jpg"; // รูปโลโก้โกดังพื้นฐาน

      // สูตรแปลงรูปร้านค้าแบบเดียวกับหน้าเว็บของบอสเป๊ะๆ
      if (targetShop.shopImg) {
        let path = targetShop.shopImg;
        if (path.indexOf("http") === 0) {
          let matchD = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (matchD) image = "https://lh3.googleusercontent.com/d/" + matchD[1];
          else {
            let matchId = path.match(/id=([^&]+)/);
            if (matchId) image = "https://lh3.googleusercontent.com/d/" + matchId[1];
            else image = path;
          }
        } else {
          let appName = "รถโกดัง-112813522";
          let tableName = "ลูกค้า";
          let safePath = path.split('/').map(part => encodeURIComponent(part)).join('/');
          image = "https://www.appsheet.com/template/gettablefileurl?appName=" + encodeURIComponent(appName) + "&tableName=" + encodeURIComponent(tableName) + "&fileName=" + safePath;
        }
      }

      // 3. จัดการเขียนทับชื่อและรูปภาพส่งให้ Facebook ดู
      html = html.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
      html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`);
      html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${image}" />`);
      html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="https://www.kodangman.shop/?shop=${shopId}" />`);
    }
  } catch (error) {
    console.log("Error fetching Google Sheets:", error);
  }

  // 4. ส่งหน้าเว็บที่ตกแต่งแล้วกลับไปให้เปิดใช้งาน
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache"
    },
    body: html
  };
};
