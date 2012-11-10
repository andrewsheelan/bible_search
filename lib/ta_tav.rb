require 'open-uri'
root_url = 'http://www.tamil-bible.com'
ta_tav_bible_index = Nokogiri::HTML(open("#{root_url}/tabletype.php?Type=TML"))
books_data = ta_tav_bible_index.css("font a")

# Code to create the books in the bible
#books_data.each_with_index do |book_data, index|
#  book_name = /[=](\w*)/.match(book_data.attr('href'))[1]
#  book_name = book_name.gsub(/^I_/,'1 ').gsub(/^II_/,'2 ').gsub(/^III_/,'3 ').gsub(/Song_of_Solomon/,'Song of Solomon')
#  book = Book.find_by_name(book_name)
#  puts book_name
#  TamilBook.create(name: book_data.text, book_id: book.id)
#end


language = Language.find_by_ref('TA')
version = Version.find_by_short_name('TAV')
books_data.each_with_index do |book_data, index|
  book_name = /[=](\w*)/.match(book_data.attr('href'))[1]

  book_name = book_name.gsub(/^I_/,'1 ').gsub(/^II_/,'2 ').gsub(/^III_/,'3 ').gsub(/^Psalms/,'Psalm').gsub(/Song_of_Solomon/,'Song of Solomon')
  book = Book.find_by_name(book_name)

  chapter_index = Nokogiri::HTML(open(book_data.attr('href')))

  
    chapters = chapter_index.css('td font a')
    chapters.each do |chapter_tags|
      chapter_url = chapter_tags.attr('href')
      chapter = /(\d*)$/.match(chapter_url)[1]
      verses_data =  Nokogiri::HTML(open(chapter_url))
      

      verses = verses_data.css('ol').text.split("\r\n")
      verses.each_with_index do |verse, index|
        verse_number = index+1
        BibleVerse.create(language_id: language.id, version_id: version.id, book_id: book.id, chapter: chapter, verse: verse_number, verse_text: verse)
    end
  end
end

