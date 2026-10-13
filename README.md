# CCNA Çalışma Seti

Bu klasör, soruları `index.html` + `images/` görselleri üzerinden gösteren
tek sayfalık bir web uygulamasıdır. Sunucu/veritabanı gerekmez; statik
hosting (GitHub Pages) üzerinde çalışır.

## İçerik (güncellendi — 3.10.2026 PDF'inden)

Site artık **314 soru** içeriyor, üç farklı formatta:
- **225 Çoktan Seçmeli** — her biri tek bir görselde (soru + şıklar + cevap birlikte).
- **59 Drag & Drop** — her biri 2 görsel (soru hali + cevaplı hali).
- **30 Lab/Simülasyon** — görev listesi + topoloji görseli + yapılandırma
  komutları + cevap. Bu bölümün metin kısmı (görev açıklamaları, komut
  çıktıları) kaynak PDF'in OCR (otomatik metin tanıma) katmanından
  çıkarıldığı için, nadiren küçük yazım/boşluk hataları içerebilir — ancak
  topoloji şemaları ve komut ekran görüntüleri orijinal görsel olarak
  birebir doğrudur. ("31 Lab" olarak etiketlenen kaynak PDF, demo sürüm
  olduğu için yalnızca ilk 30 soruyu içeriyordu; 31. soru dosyada yok.)

Eski 613 soruluk içerik tamamen bu yeni setle değiştirildi.

## Gizlilik
İçerik telifi SPOTO'ya ait olan bir dump'tan geldiği için site **herkese
açık indekslenmeyecek şekilde** ayarlı:
- `robots.txt` tüm arama motorlarını engelliyor.
- `index.html` içinde `noindex` meta etiketi var.
- Basit bir şifre ekranı var (varsayılan şifre: **ccna613** — değişmedi).

Bu bir güvenlik önlemi değil, sadece linkin tesadüfen bulunmasını
zorlaştıran bir bariyerdir. **Linki kimseyle paylaşma.**

### Şifreyi değiştirmek istersen
`app.js` dosyasının en üstünde şu satır var:
```js
const PASSWORD_HASH = "6bdaf0ae3f3bb9dae87790b7abf4e779ce5ce1775b77a9e0a6776443ead21722";
```
Yeni şifreni SHA-256'ya çevirip bu satırdaki değeri değiştir:
```bash
python3 -c "import hashlib; print(hashlib.sha256('YENİ_ŞİFREN'.encode()).hexdigest())"
```

## Güncellemeyi yayına almak

Repo zaten GitHub'a bağlı ve Pages üzerinden yayında
(`https://amithatdemirkol.github.io/ccna-web-quiz/`). Bu klasördeki
değişiklikleri GitHub Desktop ile her zamanki gibi commit edip push etmen
yeterli — birkaç dakika içinde site güncellenir.

## Notlar
- Toplam site boyutu ~21MB (eskisi ~96MB idi; görseller daha agresif
  sıkıştırıldı).
- İlerleme (not, işaretlenen sorular) tarayıcının `localStorage`'ında
  tutulur — cihaz/tarayıcı değiştirirsen veya site verisini temizlersen
  sıfırdan başlar. Eski 613 soruluk sete yazdığın notlar yeni soru
  numaralarıyla eşleşmediği için otomatik olarak görünmeyecektir.
