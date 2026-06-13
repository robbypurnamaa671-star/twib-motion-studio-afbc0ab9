
DO $$
DECLARE
  rec RECORD;
  variants TEXT[] := ARRAY['twibbon','template-twibbon','frame-twibbon','animated-twibbon'];
  v TEXT;
  v_label TEXT;
  base_slug TEXT;
  base_name TEXT;
  v_cluster TEXT;
  v_slug TEXT;
  v_route TEXT;
  v_keyword TEXT;
  v_title TEXT;
  v_h1 TEXT;
  v_meta TEXT;
  v_intro TEXT;
  v_faq JSONB;
  v_benefits JSONB;
  v_howto JSONB;
  v_related TEXT[];
BEGIN

CREATE TEMP TABLE _id_seo(slug TEXT, name TEXT, cluster_name TEXT) ON COMMIT DROP;

INSERT INTO _id_seo VALUES
  ('mpls','MPLS','education'),('osis','OSIS','education'),('smp','SMP','education'),
  ('sma','SMA','education'),('smk','SMK','education'),('sekolah-dasar','Sekolah Dasar','education'),
  ('kampus','Kampus','education'),('wisuda','Wisuda','education'),('yudisium','Yudisium','education'),
  ('kkn','KKN','education'),('ppl','PPL','education'),('dies-natalis','Dies Natalis','education'),
  ('bem','BEM','education'),('himpunan-mahasiswa','Himpunan Mahasiswa','education'),
  ('penerimaan-mahasiswa-baru','Penerimaan Mahasiswa Baru','education'),
  ('ramadhan','Ramadhan','religious'),('idul-fitri','Idul Fitri','religious'),
  ('idul-adha','Idul Adha','religious'),('isra-miraj','Isra Miraj','religious'),
  ('maulid-nabi','Maulid Nabi','religious'),('tahun-baru-islam','Tahun Baru Islam','religious'),
  ('nuzulul-quran','Nuzulul Quran','religious'),('muharram','Muharram','religious'),
  ('santunan-anak-yatim','Santunan Anak Yatim','religious'),
  ('hut-ri','HUT RI','national'),('hari-guru','Hari Guru','national'),
  ('hari-pahlawan','Hari Pahlawan','national'),('hari-kartini','Hari Kartini','national'),
  ('hari-batik','Hari Batik','national'),('hari-santri','Hari Santri','national'),
  ('hari-buruh','Hari Buruh','national'),('hari-kesehatan','Hari Kesehatan','national'),
  ('hari-anak-nasional','Hari Anak Nasional','national'),
  ('hari-lingkungan-hidup','Hari Lingkungan Hidup','national'),
  ('pkk','PKK','government'),('karang-taruna','Karang Taruna','government'),
  ('rt-rw','RT RW','government'),('desa','Desa','government'),
  ('kelurahan','Kelurahan','government'),('kecamatan','Kecamatan','government'),
  ('posyandu','Posyandu','government'),('bumdes','BUMDes','government'),
  ('pemuda-desa','Pemuda Desa','government'),
  ('fakultas-ekonomi','Fakultas Ekonomi','university'),
  ('fakultas-hukum','Fakultas Hukum','university'),
  ('fakultas-teknik','Fakultas Teknik','university'),
  ('fakultas-kedokteran','Fakultas Kedokteran','university'),
  ('fakultas-pertanian','Fakultas Pertanian','university'),
  ('fakultas-ilmu-komputer','Fakultas Ilmu Komputer','university'),
  ('jawa-tengah','Jawa Tengah','province'),('jawa-timur','Jawa Timur','province'),
  ('jawa-barat','Jawa Barat','province'),('dki-jakarta','DKI Jakarta','province'),
  ('yogyakarta','Yogyakarta','province'),('bali','Bali','province'),
  ('sumatera-utara','Sumatera Utara','province'),('sumatera-selatan','Sumatera Selatan','province'),
  ('riau','Riau','province'),('kalimantan-timur','Kalimantan Timur','province'),
  ('sulawesi-selatan','Sulawesi Selatan','province'),
  ('jakarta','Jakarta','city'),('bandung','Bandung','city'),('semarang','Semarang','city'),
  ('surabaya','Surabaya','city'),('kota-yogyakarta','Yogyakarta','city'),
  ('malang','Malang','city'),('solo','Solo','city'),('makassar','Makassar','city'),
  ('medan','Medan','city'),('palembang','Palembang','city'),('denpasar','Denpasar','city'),
  ('bekasi','Bekasi','city'),('depok','Depok','city'),('tangerang','Tangerang','city');

FOR rec IN SELECT slug, name, cluster_name FROM _id_seo LOOP
  base_slug := rec.slug;
  base_name := rec.name;
  v_cluster := rec.cluster_name;

  FOREACH v IN ARRAY variants LOOP
    IF v = 'twibbon' THEN v_label := 'Twibbon';
    ELSIF v = 'template-twibbon' THEN v_label := 'Template Twibbon';
    ELSIF v = 'frame-twibbon' THEN v_label := 'Twibbon Frame';
    ELSE v_label := 'Animated Twibbon';
    END IF;

    IF v = 'twibbon' THEN
      v_slug := 'id-' || base_slug;
      v_route := '/indonesia/' || base_slug;
    ELSE
      v_slug := 'id-' || v || '-' || base_slug;
      v_route := '/indonesia/' || v || '-' || base_slug;
    END IF;

    v_keyword := v_label || ' ' || base_name;
    v_h1 := v_label || ' ' || base_name || ' – Buat Online Gratis';
    v_title := v_label || ' ' || base_name || ' – Buat Twibbon Animasi Gratis | TwibMotion';
    v_meta := 'Buat ' || v_label || ' ' || base_name || ' online secara gratis. Upload foto, GIF, atau video — export HD untuk Instagram, TikTok, Facebook, dan WhatsApp. Tanpa daftar.';
    v_intro := 'Bikin ' || v_label || ' ' || base_name || ' dalam hitungan detik di TwibMotion. Pilih ukuran kanvas (9:16 untuk Reels, 1:1 untuk feed, 16:9 untuk YouTube), upload foto, GIF, atau video singkat, lalu pasang frame ' || base_name || ' di atasnya. Hasil HD siap dibagikan ke Instagram, TikTok, Facebook, dan WhatsApp tanpa perlu install aplikasi.';

    v_faq := jsonb_build_array(
      jsonb_build_object('question','Apakah ' || v_label || ' ' || base_name || ' gratis?','answer','Ya. TwibMotion gratis untuk semua pengguna. Versi Premium hanya menghapus watermark kecil.'),
      jsonb_build_object('question','Bisakah saya pakai GIF atau video untuk twibbon ' || base_name || '?','answer','Bisa. TwibMotion mendukung JPG, PNG, GIF, dan MP4 sampai 30 detik, maksimal 50MB.'),
      jsonb_build_object('question','Perlu daftar akun?','answer','Tidak. Anda bisa langsung export tanpa daftar. Daftar hanya jika ingin simpan template atau berlangganan Premium.'),
      jsonb_build_object('question','Format apa saja yang bisa di-export?','answer','PNG HD untuk foto, GIF untuk animasi pendek, dan MP4 untuk video frame.')
    );

    v_benefits := jsonb_build_array(
      jsonb_build_object('title','Animasi bergerak','description','Dukungan GIF dan MP4 membuat twibbon ' || base_name || ' lebih hidup di Stories dan Reels.'),
      jsonb_build_object('title','Mobile-first','description','Editor ringan, cocok dipakai dari HP untuk acara ' || base_name || ' yang mendesak.'),
      jsonb_build_object('title','Gratis & cepat','description','Tanpa install, tanpa daftar — export HD dalam hitungan detik.'),
      jsonb_build_object('title','Siap dibagikan','description','Hasil twibbon ' || base_name || ' otomatis pas untuk Instagram, TikTok, Facebook, dan WhatsApp.')
    );

    v_howto := jsonb_build_array(
      jsonb_build_object('title','Buka editor','description','Pilih rasio kanvas yang sesuai (9:16, 1:1, atau 16:9).'),
      jsonb_build_object('title','Upload foto / video','description','Drag foto, GIF, atau video pendek sebagai layer bawah.'),
      jsonb_build_object('title','Tambahkan frame ' || base_name,'description','Upload frame ' || base_name || ' atau pilih template yang tersedia.'),
      jsonb_build_object('title','Export & bagikan','description','Download dalam format HD lalu bagikan ke media sosial Anda.')
    );

    SELECT ARRAY(
      SELECT 'id-' || s.slug FROM _id_seo s
      WHERE s.cluster_name = v_cluster AND s.slug <> base_slug
      ORDER BY random() LIMIT 6
    ) INTO v_related;

    INSERT INTO seo_pages(slug, keyword, title, meta_description, intro_text, h1, category, page_type, route_path, faq_json, benefits_json, howto_json, is_indexable, related_slugs)
    VALUES (v_slug, v_keyword, v_title, v_meta, v_intro, v_h1, 'indonesia-' || v_cluster, 'global', v_route, v_faq, v_benefits, v_howto, true, v_related)
    ON CONFLICT (slug) DO UPDATE SET
      keyword = EXCLUDED.keyword,
      title = EXCLUDED.title,
      meta_description = EXCLUDED.meta_description,
      intro_text = EXCLUDED.intro_text,
      h1 = EXCLUDED.h1,
      category = EXCLUDED.category,
      page_type = EXCLUDED.page_type,
      route_path = EXCLUDED.route_path,
      faq_json = EXCLUDED.faq_json,
      benefits_json = EXCLUDED.benefits_json,
      howto_json = EXCLUDED.howto_json,
      is_indexable = EXCLUDED.is_indexable,
      related_slugs = EXCLUDED.related_slugs,
      updated_at = now();
  END LOOP;
END LOOP;

END $$;
