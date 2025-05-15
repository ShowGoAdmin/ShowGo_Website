import QRCode from "qrcode";

export async function generateDefaultQR(userId) {
     try {
          if (!userId) throw new Error("User ID is required for QR generation");

          // QR Code Generate karo
          const qrDataUrl = await QRCode.toDataURL(`https://yourapp.com/users/${userId}`);

          console.log("QR Data URL Generated:", qrDataUrl); // Debugging ke liye

          // Base64 string ko convert karo binary data me
          const byteCharacters = atob(qrDataUrl.split(",")[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
               byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "image/png" });

          console.log("Generated QR Blob:", blob, "Size:", blob.size);

          if (!blob || blob.size === 0) throw new Error("QR Code generation failed");

          return blob;
     } catch (error) {
          console.error("QR Code Generation Error:", error);
          throw error;
     }
}
