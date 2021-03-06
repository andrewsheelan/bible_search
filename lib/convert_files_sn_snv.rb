language = Language.find_by_ref('SN')
version = Version.find_by_short_name('SNV')
Book.all.each do |book|
  File.open("vendor/bible/json/#{book.name}_sn_snv.json", "w+") do |f|
    chapters = Hash.new
    bible_verses = book.bible_verses.where(language_id: language, version_id: version).order(:verse)
    bible_verses.pluck(:chapter).each do |ch|
      chapters[ch] = bible_verses.where(chapter: ch).select([:verse, :verse_text])
    end
    f.write(chapters.to_json)
  end
end
