# CCNA Çalışma Seti — GitHub Pages ile Yayınlama Rehberi

Bu klasör, sorularını `index.html` + `images/` görselleri üzerinden gösteren
tek sayfalık bir web uygulamasıdır. Sunucu/veritabanı gerekmez; herhangi bir
statik hosting'e yüklemen yeterli.

## Önemli: Gizlilik
İçerik telifi SPOTO'ya ait olan bir dump'tan geldiği için site **herkese
açık indekslenmeyecek şekilde** ayarlandı:
- `robots.txt` tüm arama motorlarını engelliyor.
- `index.html` içinde `noindex` meta etiketi var.
- Basit bir şifre ekranı var (varsayılan şifre: **ccna613**).

Bu bir güvenlik önlemi değil, sadece linkin tesadüfen bulunmasını/paylaşılmasını
zorlaştıran bir bariyerdir. **Linki kimseyle paylaşma.**

### Şifreyi değiştirmek istersen
`app.js` dosyasının en üstünde şu satır var:
```js
const PASSWORD_HASH = "6bdaf0ae3f3bb9dae87790b7abf4e779ce5ce1775b77a9e0a6776443ead21722";
```
Yeni şifreni SHA-256'ya çevirip bu satırdaki değeri değiştir. Terminalde:
```bash
python3 -c "import hashlib; print(hashlib.sha256('YENİ_ŞİFREN'.encode()).hexdigest())"
```
Çıkan uzun kodu yukarıdaki satıra yapıştır.

## GitHub Pages ile ücretsiz yayınlama (adım adım)

1. **GitHub hesabı aç** (yoksa): https://github.com/join
2. **Yeni bir repo oluştur**: sağ üstteki "+" → "New repository".
   - Repository name: örn. `ccna-notlarim`
   - **Private** seç (kaynak kodun herkese açık görünmesin diye).
   - "Create repository" butonuna bas.
3. Bilgisayarında bu klasörü (bu ZIP'i açtığın yer) o repo'ya push et:
   ```bash
   cd klasor-yolu
   git init
   git add .
   git commit -m "ilk yükleme"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/ccna-notlarim.git
   git push -u origin main
   ```
   (Git kurulu değilse: https://git-scm.com/downloads)
4. GitHub'da repo sayfasına git → **Settings → Pages**.
   - "Build and deployment" → Source: **Deploy from a branch**
   - Branch: **main**, klasör: **/(root)** → **Save**.
5. Birkaç dakika içinde siten şu adreste yayında olacak:
   ```
   https://KULLANICI_ADIN.github.io/ccna-notlarim/
   ```
   (Private repo'da Pages'in çalışması için ücretsiz hesapta bile bu özellik
   destekleniyor; site public URL'den erişilebilir ama repo kodu gizli kalır,
   arama motorlarına kapalı ve şifre korumalı.)

## Notlar
- Toplam site boyutu ~90-100MB (görseller WebP ile sıkıştırıldı, orijinali
  ~900MB idi). GitHub'a push işlemi bağlantı hızına göre birkaç dakika sürebilir.
- İlerleme (görülen/işaretlenen sorular) tarayıcının `localStorage`'ında
  tutulur — cihaz/tarayıcı değiştirirsen sıfırdan başlar.
- 613 sorudan bazılarının (dump'ta eksik olanlar) cevap görseli veya soru
  görseli bulunmuyor olabilir; uygulama bunu otomatik algılayıp "görsel
  mevcut değil" mesajı gösterir.
