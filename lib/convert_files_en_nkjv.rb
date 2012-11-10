Book.all.each do |book|
  File.open("vendor/bible/json/#{book.name}_en_nkjv.json", "w+") do |f|
    chapters = Hash.new
    bible_verses = book.bible_verses
    bible_verses.pluck(:chapter).each do |ch|
      chapters[ch] = bible_verses.where(chapter: ch).select([:verse, :verse_text])
    end
    f.write(chapters.to_json)
  end
end
