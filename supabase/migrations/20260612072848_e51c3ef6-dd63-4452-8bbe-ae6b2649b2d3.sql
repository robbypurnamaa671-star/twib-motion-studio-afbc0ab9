
-- Phase A: Massive programmatic SEO seed.
-- Generates hundreds of keyword pages from category × modifier matrix,
-- plus 10 country pages and additional keyword landings.
-- All inserts use ON CONFLICT (slug) DO NOTHING so existing pages are untouched.

DO $$
DECLARE
  cat record;
  modr record;
  ctry record;
  kw record;
  v_slug text;
  v_keyword text;
  v_h1 text;
  v_title text;
  v_meta text;
  v_intro text;
  v_faq jsonb;
  v_benefits jsonb;
  v_howto jsonb;
BEGIN

-- ===== Categories table (in-memory) =====
CREATE TEMP TABLE _cats(slug text, name text, grp text, lang text) ON COMMIT DROP;
INSERT INTO _cats VALUES
  ('school','School','education','en'),
  ('university','University','education','en'),
  ('graduation','Graduation','education','en'),
  ('academic-event','Academic Event','education','en'),
  ('seminar','Seminar','event','en'),
  ('webinar','Webinar','event','en'),
  ('conference','Conference','event','en'),
  ('workshop','Workshop','event','en'),
  ('ramadan','Ramadan','religious','en'),
  ('eid','Eid','religious','en'),
  ('christmas','Christmas','religious','en'),
  ('easter','Easter','religious','en'),
  ('diwali','Diwali','religious','en'),
  ('independence-day','Independence Day','national','en'),
  ('national-holiday','National Holiday','national','en'),
  ('memorial-day','Memorial Day','national','en'),
  ('ngo','NGO','organization','en'),
  ('community','Community','organization','en'),
  ('charity','Charity','organization','en'),
  ('fundraising','Fundraising','organization','en'),
  ('company-event','Company Event','corporate','en'),
  ('employee-campaign','Employee Campaign','corporate','en'),
  ('brand-campaign','Brand Campaign','corporate','en'),
  ('birthday','Birthday','event','en'),
  ('wedding','Wedding','event','en'),
  ('anniversary','Anniversary','event','en'),
  ('new-year','New Year','national','en'),
  ('valentines-day','Valentine''s Day','event','en'),
  ('mothers-day','Mother''s Day','event','en'),
  ('fathers-day','Father''s Day','event','en'),
  ('hut-ri','HUT RI','nasional','id'),
  ('hari-santri','Hari Santri','religi','id'),
  ('hari-batik','Hari Batik','nasional','id'),
  ('hari-buruh','Hari Buruh','nasional','id'),
  ('hari-anak','Hari Anak','nasional','id'),
  ('hari-bumi','Hari Bumi','nasional','id'),
  ('hari-pendidikan','Hari Pendidikan','nasional','id'),
  ('hari-kesaktian-pancasila','Hari Kesaktian Pancasila','nasional','id'),
  ('hari-lingkungan','Hari Lingkungan','nasional','id'),
  ('hari-ulang-tahun-perusahaan','HUT Perusahaan','korporat','id');

-- ===== Modifiers table =====
CREATE TEMP TABLE _mods(slug text, word text, lang text) ON COMMIT DROP;
INSERT INTO _mods VALUES
  ('free','Free','en'),
  ('animated','Animated','en'),
  ('online','Online','en'),
  ('hd','HD','en'),
  ('gif','GIF','en'),
  ('video','Video','en'),
  ('template','Template','en'),
  ('design','Design','en'),
  ('2026','2026','en'),
  ('modern','Modern','en'),
  ('best','Best','en'),
  ('creative','Creative','en');

-- ===== Generate base category pages =====
FOR cat IN SELECT * FROM _cats LOOP
  v_slug := cat.slug;
  v_keyword := cat.name || (CASE WHEN cat.lang='id' THEN ' Twibbon' ELSE ' Twibbon' END);
  v_h1 := (CASE WHEN cat.lang='id' THEN 'Twibbon '||cat.name||' Online & Animasi' ELSE 'Create '||cat.name||' Twibbon Online' END);
  v_title := v_keyword || ' – Free Online Twibbon Maker | TwibMotion';
  v_meta := (CASE WHEN cat.lang='id'
    THEN 'Buat twibbon '||cat.name||' online dengan foto, GIF, atau video. Gratis, tanpa daftar, ekspor HD dalam hitungan detik.'
    ELSE 'Create a '||cat.name||' twibbon online with photo, GIF, or video. Free, no signup, HD export in seconds.' END);
  v_intro := (CASE WHEN cat.lang='id'
    THEN 'Buat twibbon '||cat.name||' dalam hitungan menit dengan TwibMotion. Upload foto, GIF, atau video pendek, pasang frame '||cat.name||' di atasnya, lalu ekspor HD untuk Instagram, TikTok, dan WhatsApp.'
    ELSE 'Make a '||cat.name||' twibbon in minutes with TwibMotion. Upload your photo, GIF, or short video, drop the '||cat.name||' frame on top, and export in HD for Instagram, TikTok, and WhatsApp.' END);
  v_faq := jsonb_build_array(
    jsonb_build_object('question', (CASE WHEN cat.lang='id' THEN 'Apakah twibbon '||cat.name||' gratis?' ELSE 'Is the '||cat.name||' twibbon free?' END),
                       'answer',   (CASE WHEN cat.lang='id' THEN 'Ya. TwibMotion gratis dipakai. Premium hanya menghilangkan watermark kecil.' ELSE 'Yes. TwibMotion is free to use. Premium removes the small watermark.' END)),
    jsonb_build_object('question', (CASE WHEN cat.lang='id' THEN 'Bisakah saya pakai video atau GIF?' ELSE 'Can I use video or GIF for my '||cat.name||' twibbon?' END),
                       'answer',   (CASE WHEN cat.lang='id' THEN 'Bisa. Format JPG, PNG, GIF, dan MP4 hingga 30 detik didukung.' ELSE 'Yes. JPG, PNG, GIF, and MP4 up to 30 seconds are supported.' END)),
    jsonb_build_object('question', (CASE WHEN cat.lang='id' THEN 'Apakah hasilnya HD?' ELSE 'Are exports HD?' END),
                       'answer',   (CASE WHEN cat.lang='id' THEN 'Ya. Ekspor PNG, GIF, atau MP4 dalam resolusi tinggi.' ELSE 'Yes. Export crisp PNG, GIF, or MP4 ready for social media.' END))
  );
  v_benefits := jsonb_build_array(
    jsonb_build_object('title','Animated frames','description','Use GIFs or short videos as your '||cat.name||' twibbon frame.'),
    jsonb_build_object('title','Browser-based','description','Runs in your browser. No installs, no upload to servers.'),
    jsonb_build_object('title','Mobile-first','description','Works smoothly on phones for last-minute '||cat.name||' posts.'),
    jsonb_build_object('title','HD exports','description','Crisp PNG, GIF, or MP4 ready for Instagram, TikTok, WhatsApp.')
  );
  v_howto := jsonb_build_array(
    jsonb_build_object('title','Open the editor','description','Pick a canvas ratio that fits the platform you will share on.'),
    jsonb_build_object('title','Upload your media','description','Drop a photo, GIF, or short video as your bottom layer.'),
    jsonb_build_object('title','Add the '||cat.name||' frame','description','Place the '||cat.name||' twibbon frame on top, then scale and position your media.'),
    jsonb_build_object('title','Export and share','description','Export as HD image, GIF, or MP4 and share to Instagram, TikTok, or WhatsApp.')
  );

  INSERT INTO seo_pages(slug, keyword, title, meta_description, intro_text, h1, category, page_type, faq_json, benefits_json, howto_json, is_indexable, related_slugs)
  VALUES(v_slug, v_keyword, v_title, v_meta, v_intro, v_h1, cat.grp, 'keyword', v_faq, v_benefits, v_howto, true, ARRAY[]::text[])
  ON CONFLICT (slug) DO NOTHING;
END LOOP;

-- ===== Generate category × modifier matrix =====
FOR cat IN SELECT * FROM _cats LOOP
  FOR modr IN SELECT * FROM _mods LOOP
    v_slug := modr.slug || '-' || cat.slug;
    v_keyword := modr.word || ' ' || cat.name || ' Twibbon';
    v_h1 := modr.word || ' ' || cat.name || ' Twibbon Maker';
    v_title := v_keyword || ' – TwibMotion';
    v_meta := 'Make a ' || lower(modr.word) || ' ' || cat.name || ' twibbon online with photo, GIF, or video. ' || modr.word || ', no signup, HD export.';
    v_intro := 'Create a ' || modr.word || ' ' || cat.name || ' twibbon in minutes. TwibMotion supports animated GIF and MP4 frames so your ' || cat.name || ' twibbon can move on Instagram Stories, Reels, and TikTok.';
    v_faq := jsonb_build_array(
      jsonb_build_object('question','Is the '||modr.word||' '||cat.name||' twibbon really free?','answer','Yes — TwibMotion is free. Premium only removes the small watermark.'),
      jsonb_build_object('question','Can I use my own '||cat.name||' frame?','answer','Yes. Upload your own PNG, GIF, or MP4 as the top twibbon layer.'),
      jsonb_build_object('question','What export formats are supported?','answer','PNG, JPG, GIF, MP4, and WebM up to 30 seconds.')
    );
    v_benefits := jsonb_build_array(
      jsonb_build_object('title',modr.word||' & fast','description','Generate a '||cat.name||' twibbon in under a minute.'),
      jsonb_build_object('title','Animated support','description','GIF and MP4 frames bring your '||cat.name||' twibbon to life.'),
      jsonb_build_object('title','Mobile friendly','description','Edit and export directly from your phone.')
    );
    v_howto := jsonb_build_array(
      jsonb_build_object('title','Pick a canvas','description','Choose 9:16, 1:1, or 16:9 depending on where you will share.'),
      jsonb_build_object('title','Upload media','description','Drop a photo, GIF, or short video for the bottom layer.'),
      jsonb_build_object('title','Add the '||cat.name||' frame','description','Use a built-in template or upload your own '||cat.name||' frame.'),
      jsonb_build_object('title','Export','description','Download an HD image, GIF, or MP4 ready to share.')
    );

    INSERT INTO seo_pages(slug, keyword, title, meta_description, intro_text, h1, category, page_type, faq_json, benefits_json, howto_json, is_indexable, related_slugs)
    VALUES(v_slug, v_keyword, v_title, v_meta, v_intro, v_h1, cat.grp, 'keyword', v_faq, v_benefits, v_howto, true,
           ARRAY[cat.slug]::text[])
    ON CONFLICT (slug) DO NOTHING;
  END LOOP;
END LOOP;

-- ===== Country pages (page_type=global, route_path=/country/<slug>) =====
CREATE TEMP TABLE _countries(slug text, name text, demonym text, lang_hint text) ON COMMIT DROP;
INSERT INTO _countries VALUES
  ('indonesia','Indonesia','Indonesian','id'),
  ('usa','USA','American','en'),
  ('india','India','Indian','en'),
  ('philippines','Philippines','Filipino','en'),
  ('malaysia','Malaysia','Malaysian','en'),
  ('pakistan','Pakistan','Pakistani','en'),
  ('nigeria','Nigeria','Nigerian','en'),
  ('brazil','Brazil','Brazilian','en'),
  ('mexico','Mexico','Mexican','en'),
  ('uk','UK','British','en');

FOR ctry IN SELECT * FROM _countries LOOP
  v_slug := 'country-' || ctry.slug;
  v_keyword := 'Twibbon Maker in ' || ctry.name;
  v_h1 := 'Twibbon Maker in ' || ctry.name;
  v_title := 'Twibbon Maker in ' || ctry.name || ' – Animated Campaign Frames | TwibMotion';
  v_meta := 'Create animated twibbons and campaign frames in ' || ctry.name || '. Free online twibbon maker with photo, GIF, and video support. HD export, no signup.';
  v_intro := 'TwibMotion is the easiest twibbon and campaign frame maker for ' || ctry.demonym || ' creators. Build animated twibbons for elections, religious events, national holidays, schools, and brand campaigns across ' || ctry.name || '. Upload your photo, GIF, or short video, drop a frame on top, and export an HD twibbon for Instagram, Facebook, TikTok, and WhatsApp.';
  v_faq := jsonb_build_array(
    jsonb_build_object('question','Is TwibMotion available in '||ctry.name||'?','answer','Yes. TwibMotion works in every country, including '||ctry.name||', directly from your browser.'),
    jsonb_build_object('question','Can I make animated twibbons for '||ctry.name||' campaigns?','answer','Yes. Use GIF or MP4 frames up to 30 seconds for fully animated twibbons.'),
    jsonb_build_object('question','Do I need to sign up?','answer','No signup is required for free exports. Sign in only to save templates or remove the watermark.')
  );
  v_benefits := jsonb_build_array(
    jsonb_build_object('title','Local-ready','description','Templates for '||ctry.name||' elections, holidays, religious events, and campaigns.'),
    jsonb_build_object('title','Animated frames','description','GIF and MP4 twibbons that stand out on Stories and Reels.'),
    jsonb_build_object('title','Mobile-first','description','Built for phones — perfect for on-the-go campaign posts in '||ctry.name||'.')
  );
  v_howto := jsonb_build_array(
    jsonb_build_object('title','Open the editor','description','Pick the canvas size that fits your platform (9:16, 1:1, 16:9).'),
    jsonb_build_object('title','Upload your photo','description','Drag in a photo, GIF, or video clip as your bottom layer.'),
    jsonb_build_object('title','Add the '||ctry.name||' frame','description','Upload a campaign frame or pick a '||ctry.name||' template.'),
    jsonb_build_object('title','Export & share','description','Download HD image, GIF, or MP4 and post to social media.')
  );

  INSERT INTO seo_pages(slug, keyword, title, meta_description, intro_text, h1, category, page_type, route_path, faq_json, benefits_json, howto_json, is_indexable)
  VALUES(v_slug, v_keyword, v_title, v_meta, v_intro, v_h1, 'country', 'global', '/country/'||ctry.slug, v_faq, v_benefits, v_howto, true)
  ON CONFLICT (slug) DO NOTHING;

  -- Variant: animated twibbon for <country>
  v_slug := 'country-animated-' || ctry.slug;
  v_keyword := 'Animated Twibbon for ' || ctry.name;
  v_title := 'Animated Twibbon for ' || ctry.name || ' – GIF & Video Campaign Frames | TwibMotion';
  v_meta := 'Make animated GIF and video twibbons in ' || ctry.name || '. Free online maker with HD export, mobile-first editor, and ready-to-use campaign frames.';
  v_h1 := 'Animated Twibbon Maker for ' || ctry.name;
  v_intro := 'Build animated twibbons for ' || ctry.name || ' in seconds. TwibMotion supports GIF and MP4 frames so your twibbon moves on Instagram Stories, Reels, TikTok, and WhatsApp Status.';
  INSERT INTO seo_pages(slug, keyword, title, meta_description, intro_text, h1, category, page_type, route_path, faq_json, benefits_json, howto_json, is_indexable)
  VALUES(v_slug, v_keyword, v_title, v_meta, v_intro, v_h1, 'country', 'global', '/country/animated-'||ctry.slug, v_faq, v_benefits, v_howto, true)
  ON CONFLICT (slug) DO NOTHING;

  -- Variant: campaign frame maker in <country>
  v_slug := 'country-campaign-frame-' || ctry.slug;
  v_keyword := 'Campaign Frame Maker in ' || ctry.name;
  v_title := 'Campaign Frame Maker in ' || ctry.name || ' – Free Online Tool | TwibMotion';
  v_meta := 'Design campaign frames for ' || ctry.name || ' online. Animated GIF and video twibbons, HD export, no signup required.';
  v_h1 := 'Campaign Frame Maker in ' || ctry.name;
  v_intro := 'Launch a campaign in ' || ctry.name || ' with custom animated frames. TwibMotion lets your supporters add their photo behind your campaign frame and share instantly.';
  INSERT INTO seo_pages(slug, keyword, title, meta_description, intro_text, h1, category, page_type, route_path, faq_json, benefits_json, howto_json, is_indexable)
  VALUES(v_slug, v_keyword, v_title, v_meta, v_intro, v_h1, 'country', 'global', '/country/campaign-frame-maker-'||ctry.slug, v_faq, v_benefits, v_howto, true)
  ON CONFLICT (slug) DO NOTHING;
END LOOP;

-- ===== Additional keyword landings =====
CREATE TEMP TABLE _kws(slug text, kw text, title text, meta text, h1 text) ON COMMIT DROP;
INSERT INTO _kws VALUES
  ('facebook-frame-maker','Facebook Frame Maker','Facebook Frame Maker – Animated Profile Frames | TwibMotion','Create animated Facebook profile frames online. Free GIF and video twibbons with HD export.','Facebook Frame Maker'),
  ('instagram-frame-maker','Instagram Frame Maker','Instagram Frame Maker – Animated Twibbon for Reels & Stories | TwibMotion','Make animated Instagram frames for Reels, Stories, and posts. Free online twibbon maker.','Instagram Frame Maker'),
  ('social-media-frame-maker','Social Media Frame Maker','Social Media Frame Maker – Animated Campaign Frames | TwibMotion','Design animated campaign frames for every social network. Free online maker with HD export.','Social Media Frame Maker'),
  ('campaign-frame-maker','Campaign Frame Maker','Campaign Frame Maker – Free Animated Twibbons | TwibMotion','Build campaign frames that move. GIF and video twibbons, HD export, mobile-friendly editor.','Campaign Frame Maker'),
  ('profile-frame-maker','Profile Frame Maker','Profile Frame Maker – Animated Avatar Frames | TwibMotion','Create animated profile frames for any social platform. Free online maker, no signup.','Profile Frame Maker'),
  ('event-frame-maker','Event Frame Maker','Event Frame Maker – Animated Twibbons for Events | TwibMotion','Promote events with animated twibbon frames. Free online maker with HD export.','Event Frame Maker'),
  ('online-twibbon-maker','Online Twibbon Maker','Online Twibbon Maker – Free Animated Campaign Frames | TwibMotion','Create animated twibbons online with photo, GIF, or video. Free, no signup, HD export.','Online Twibbon Maker');

FOR kw IN SELECT * FROM _kws LOOP
  v_faq := jsonb_build_array(
    jsonb_build_object('question','Is the '||kw.kw||' free?','answer','Yes. TwibMotion is free. Premium removes the small watermark.'),
    jsonb_build_object('question','Can I use GIF or video?','answer','Yes. JPG, PNG, GIF, and MP4 up to 30 seconds are supported.')
  );
  v_benefits := jsonb_build_array(
    jsonb_build_object('title','Animated','description','GIF and MP4 frames bring twibbons to life.'),
    jsonb_build_object('title','Free','description','No signup needed. Premium only removes the watermark.'),
    jsonb_build_object('title','Mobile-first','description','Edit and export from your phone.')
  );
  v_howto := jsonb_build_array(
    jsonb_build_object('title','Open the editor','description','Pick a canvas ratio.'),
    jsonb_build_object('title','Upload media','description','Drop your photo, GIF, or video.'),
    jsonb_build_object('title','Add a frame','description','Pick a template or upload your own frame.'),
    jsonb_build_object('title','Export','description','Download HD image, GIF, or MP4.')
  );

  INSERT INTO seo_pages(slug, keyword, title, meta_description, intro_text, h1, category, page_type, route_path, faq_json, benefits_json, howto_json, is_indexable)
  VALUES(kw.slug, kw.kw, kw.title, kw.meta, 'Use the '||kw.kw||' on TwibMotion to create animated, HD-ready frames in seconds. Upload your photo, GIF, or short video, drop the frame on top, then export and share.', kw.h1, 'tool', 'global', '/'||kw.slug, v_faq, v_benefits, v_howto, true)
  ON CONFLICT (slug) DO NOTHING;
END LOOP;

END $$;
