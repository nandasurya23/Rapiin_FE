/**
 * Kompresi gambar logo secara lokal menggunakan HTML Canvas.
 */
export function compressLogoImage(file: File, maxW = 180, maxH = 180): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Gagal memproses gambar."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file lokal."));
    reader.readAsDataURL(file);
  });
}
