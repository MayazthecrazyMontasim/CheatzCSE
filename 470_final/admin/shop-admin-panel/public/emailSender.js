const nodemailer = require("nodemailer");


// ============================
// CONFIG — EDIT THESE
// ============================
const EMAIL = "project01app01@gmail.com";
const APP_PASSWORD = "thwf oosn agan xabe"; // Gmail app password
const RECIPIENTS = [
  "s.nahian86@gmail.com",
  "syedadnanrahman071@gmail.com",
  "labibirfan369@gmail.com",
  "tazbiahlan@gmail.com",
  "sjalvi2001@gmail.com"
];


// HTML content (your poster or design)
const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Urbor Essentials - Safe Broiler Chicken</title>
</head>
<body style="font-family: sans-serif; background-color: #f8f9fa; margin: 20px 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: white; border-radius: 15px; overflow: hidden; border: 1px solid #e0e0e0;">
          <tr>
            <td style="background-color: #005d2a; padding: 30px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px; line-height: 1.3;">Urbor Essentials-এর Safe Broiler Chicken,<br>প্রথম অর্ডারেই পাচ্ছেন <span style="color: #ffc107; font-weight: bold;">১৫০ টাকা ছাড়!</span></h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; text-align: center; color: #495057;">
              <p style="text-align: left; margin-bottom: 20px; line-height: 1.5;">
                Urbor Essentials নিয়ে এসেছে <span style="color: #005d2a; font-weight: bold;">১০০% আন্টিবায়োটিক-মুক্ত</span> Safe Broiler Chicken, যা আপনার পরিবারের স্বাস্থ্যের জন্য <span style="color: #005d2a; font-weight: bold;">সম্পূর্ণ নিরাপদ</span>।
              </p>
             
              <img src="https://www.urbor.org/s_p/p1.jpeg" alt="Safe Broiler Chicken" width="100%" style="max-width: 100%; height: auto; margin: 0 auto 15px; display: block;">
             
              <div style="background-color: #07ff83ff; padding: 8px 15px; border-radius: 30px; display: inline-block; font-weight: bold; margin-top: 10px;">
                <span>24 ঘণ্টা</span>
                <span>📞</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e9ecef; color: #495057;">
              <p style="margin: 12px 0; line-height: 1.5; font-size: 15px;">
                URBOR ESSENTIALS আপনাকে দিচ্ছে নিরাপদ বয়লার মুরগি, যা সম্পূর্ণ পরিষ্কার ও স্বাস্থ্যসম্মত পদ্ধতিতে প্রক্রিয়াজাত করা হয়। বাজারের ঝামেলা ছাড়াই আপনার দরজায় পৌঁছে দেব তাজা ও নিরাপদ মুরগি।
              </p>
             
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSdsT2GfUEWkkwi4Sb6XzOumhyw6Hf-POZbUwoclJSzJSeu6YQ/viewform?usp=publish-editor"
                 style="display: inline-block; background-color: #005d2a !important; color: white !important; text-decoration: none; padding: 18px 50px; border-radius: 35px; font-weight: bold; font-size: 20px; margin: 15px 0; line-height: 1;">
                এখনই অর্ডার করুন
              </a>
             
              <p style="font-weight: bold; color: #005d2a; margin-top: 8px;">
                প্রথম অর্ডারেই ১৫০ টাকা ডিসকাউন্ট
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;


// ============================
// MAIL SENDER
// ============================
async function sendEmails() {
  console.log(`🚀 Starting to send emails to ${RECIPIENTS.length} recipient(s)...`);


  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL,
      pass: APP_PASSWORD
    },
    pool: true, // Use pooled connections
    maxConnections: 1 // Limit concurrent connections
  });


  // Verify connection
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified");
  } catch (error) {
    console.error("❌ SMTP connection failed:", error.message);
    return;
  }


  let successCount = 0;
  let failCount = 0;


  for (let i = 0; i < RECIPIENTS.length; i++) {
    const to = RECIPIENTS[i];
    const progress = ((i + 1) / RECIPIENTS.length * 100).toFixed(1);


    try {
      const info = await transporter.sendMail({
        from: `"Event Team" <${EMAIL}>`,
        to: to,
        subject: "Our offer",
        html: HTML_CONTENT,
        headers: {
          'X-Entity-Ref-ID': new Date().getTime() + Math.random().toString(36).substr(2, 9)
        }
      });


      successCount++;
      console.log(`✅ [${progress}%] Sent to: ${to} | Message ID: ${info.messageId}`);


      // delay to avoid spam blocking
      if (i < RECIPIENTS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }


    } catch (err) {
      failCount++;
      console.error(`❌ [${progress}%] Failed to send to: ${to}`);
      console.error(`   Error: ${err.message}`);
    }
  }


  console.log("\n" + "=".repeat(50));
  console.log("📧 Email Sending Summary:");
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📊 Total: ${RECIPIENTS.length}`);
  console.log("=".repeat(50));
}


// Error handling for uncaught exceptions
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});


// Run the script
sendEmails();
