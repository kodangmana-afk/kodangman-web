exports.handler = async (event) => {
  const shopId = event.queryStringParameters.shop;
  const gasUrl = "https://script.google.com/macros/s/AKfycbwl3qPZkiCxF3vb1ltlg7Cky7H7rSonocdkEAz-TVq_rKrFuXQ5Y-fDJVCUpx1u44c/exec";
  const baseUrl = process.env.URL || "https://www.kodangman.shop";

  let html = "";
  try {
     // บังคับให้ไปอ่านโค้ดหน้าบ้านที่ index.html
     const indexRes = await fetch(baseUrl + "/index.html");
     html = await indexRes.text();
  } catch(e) {
     return { statusCode: 500, body: "Error loading site" };
  }

  // ถ้าไม่มีรหัสล็อคต่อท้าย ให้โชว์เว็บปกติเลย
  if (!shopId) {
      return { statusCode: 200, headers: { "Content-Type": "text/html; charset=utf-8" }, body: html };
  }

  let finalTitle = "โกดังมานะ | ตลาดเซฟวันโก";
  let finalDesc = "พิกัดร้านค้า ดูสถานะเปิด-ปิดร้านได้แบบเรียลไทม์";
  let image = "https://i.postimg.cc/wMVjb074/khe-ywx-xn.jpg";

  try {
    const res = await fetch(gasUrl);
    const shops = await res.json();
    const targetShop = shops.find(s => s.lock && s.lock.includes(shopId));

    if (targetShop) {
      // 🌟 จัดแคปชั่นให้ครบเครื่อง!
      finalTitle = `🟢 ร้าน ${targetShop.name} @ ล็อค ${shopId} | ตลาดเซฟวันโก`;
      
      let phoneText = targetShop.phone ? `☎️ โทร: ${targetShop.phone}` : '';
      let catText = targetShop.category ? `📍 หมวดหมู่: ${targetShop.category}` : '';
      let extraInfo = [catText, phoneText].filter(Boolean).join(' | ');

      finalDesc = extraInfo !== "" 
          ? `${extraInfo} \nคลิกดูแผนที่นำทางมาร้านเราแบบเป๊ะๆ ไม่มีหลง แวะมาอุดหนุนกันนะคะ! 👇✨` 
          : `คลิกดูแผนที่นำทางมาร้านเราแบบเป๊ะๆ ไม่มีหลง แวะมาอุดหนุนกันนะคะ! 👇✨`;
      
      // 🌟 ปรับสูตรดึงรูปให้ Facebook ชอบ
      if (targetShop.ShopImg || targetShop.shopImg) {
          let path = targetShop.ShopImg || targetShop.shopImg;
          if (path.indexOf("http") === 0) {
              let matchD = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
              if (matchD) image = "https://lh3.googleusercontent.com/d/" + matchD[1] + "=w1200-h630-p";
              else {
                  let matchId = path.match(/id=([^&]+)/);
                  if (matchId) image = "https://lh3.googleusercontent.com/d/" + matchId[1] + "=w1200-h630-p";
                  else image = path;
              }
          } else {
              let appName = "รถโกดัง-112813522";
              let tableName = "ลูกค้า";
              let safePath = path.split('/').map(part => encodeURIComponent(part)).join('/');
              image = "https://www.appsheet.com/template/gettablefileurl?appName=" + encodeURIComponent(appName) + "&tableName=" + encodeURIComponent(tableName) + "&fileName=" + safePath;
          }
      }
    }
  } catch (error) {
    console.log("Error fetching Google Sheets:", error);
  }

  // ล้างแท็กเก่าออกให้เกลี้ยง กันเฟสบุ๊คสับสน
  html = html.replace(/<title>.*<\/title>/i, '');
  html = html.replace(/<meta[^>]*property="og:title"[^>]*>/gi, '');
  html = html.replace(/<meta[^>]*property="og:image"[^>]*>/gi, '');
  html = html.replace(/<meta[^>]*property="og:description"[^>]*>/gi, '');
  html = html.replace(/<meta[^>]*property="og:url"[^>]*>/gi, '');

  // ฝังแท็กใหม่ที่ถูกต้องลงไป
  const metaTags = `
    <title>${finalTitle}</title>
    <meta property="og:title" content="${finalTitle}" />
    <meta property="og:description" content="${finalDesc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${baseUrl}/?shop=${shopId}" />
  `;
  html = html.replace('</head>', `${metaTags}\n</head>`);

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
    body: html
  };
};
