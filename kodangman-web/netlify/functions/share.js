exports.handler = async (event) => {
  const shopId = event.queryStringParameters.shop;
  const gasUrl = "https://script.google.com/macros/s/AKfycbw13qPZkiCxF3vb1ltlg7Cky7H7rSonocdkEAz-TVq_rKrFuXQ5Y-fDJVCUpx1u44c/exec";
  const baseUrl = process.env.URL || "https://www.kodangman.shop";
  
  let html = "";
  try {
     const indexRes = await fetch(baseUrl + "/");
     html = await indexRes.text();
  } catch(e) {
     return { statusCode: 500, body: "Error loading site" };
  }

  // ค่าเริ่มต้น (รูปหน้าร้านพื้นฐาน)
  let finalTitle = "โกดังมานะ";
  let finalDesc = "พิกัดร้านค้า ดูสถานะเปิด-ปิดร้านได้แบบเรียลไทม์";
  let image = "https://i.postimg.cc/wMVjb074/khe-ywx-xn.jpg";

  try {
    const res = await fetch(gasUrl);
    const shops = await res.json();
    const targetShop = shops.find(s => s.lock && s.lock.includes(shopId));

    if (targetShop) {
      finalTitle = `พิกัดร้าน: ${targetShop.name} (ล็อค ${shopId})`;
      finalDesc = `ดูพิกัดร้าน ${targetShop.name} แผนที่นำทาง และสถานะร้านคลิกเลย! 👇`;
      
      // ดึงรูปหน้าร้าน (ShopImg) เป็นหลัก ตามที่บอสต้องการค่ะ
      if (targetShop.ShopImg) {
          image = targetShop.ShopImg;
      }
    }
  } catch (error) {
    console.log("Error fetching Google Sheets:", error);
  }

  html = html.replace(/<title>.*<\/title>/i, `<title>${finalTitle}</title>`);
  html = html.replace(/<meta[^>]*property="og:title"[^>]*>/gi, `<meta property="og:title" content="${finalTitle}" />`);
  html = html.replace(/<meta[^>]*property="og:image"[^>]*>/gi, `<meta property="og:image" content="${image}" />`);
  html = html.replace(/<meta[^>]*property="og:description"[^>]*>/gi, `<meta property="og:description" content="${finalDesc}" />`);
  html = html.replace(/<meta[^>]*property="og:url"[^>]*>/gi, "");

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
    body: html
  };
};
