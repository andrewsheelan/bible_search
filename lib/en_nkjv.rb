require 'open-uri'
root_url = 'http://www.biblegateway.com'
en_nkjv_bible_index = Nokogiri::HTML(URI.open("#{root_url}/versions/New-King-James-Version-NKJV-Bible/"))
books_data = en_nkjv_bible_index.css(".infotable tr")

# Code to create the books in the bible
#chapters.each_with_index do |chapter, index|
  #Book.create(name: chapter.css('td').first.text) if index > 0
#end

old_verse_number = nil
bible_verse = nil

language = Language.find_by_ref('EN')
version = Version.find_by_short_name('NKJV')
books_data.each_with_index do |book_data, index|
  if index > 0
    book_tags = book_data.css('td')
    book = Book.find_by_name(book_tags.first.text)
    chapters = book_tags[1].css('a')
    chapters.each do |chapter_tags|
      chapter_url = chapter_tags.attr('href')
      chapter = chapter_tags.text
      verses_data =  Nokogiri::HTML(URI.open(root_url + chapter_url))
      verses = verses_data.css('.passage').css('p span.text')
      verses.each do |verse|
        verse_number = verse.attr('class').slice(/\d+$/)
        uniq_key = "#{book.id} | #{verse_number}"
        if(uniq_key != old_verse_number)
          bible_verse = BibleVerse.create(language_id: language.id, version_id: version.id, book_id: book.id, chapter: chapter, verse: verse_number, verse_text: verse.text, misc_data: verse.to_html)
          old_verse_number = uniq_key
        else
          bible_verse.verse_text = "#{bible_verse.verse_text} #{verse.text}"
          bible_verse.misc_data = "#{bible_verse.misc_data} #{verse.to_html}"
          bible_verse.save
        end

      end
    end
  end
end

