agent = Mechanize.new
page = agent.get("http://www.sinhalaholybible.com/en/read-bible-sinhala-holy-bible/read-bible-sinhala-tamil-english.html")
form = agent.page.forms.first
form.username='andrewsheelan'
form.password='welcome123'
page = form.submit form.buttons.first

doc = page.parser


language = Language.find_by_ref('SN')
version = Version.find_by_short_name('SNV')

page_books = doc.css('#book option')
page_books.each_with_index do |page_book, book_index|
  form = agent.page.forms[2]
  form.b = page_book.attr('value')
  page = form.submit
  doc = page.parser

  page_chapters = doc.css('#chapter option')
  page_chapters.each_with_index do |page_chapter, chapter_index|
    form = agent.page.forms[2]
    form.c=page_chapter.attr('value')
    page = form.submit
    doc = page.parser
    page_verses = doc.css('.zef_bible_Chapter .zef_verse')
    page_verse_numbers = doc.css('.zef_bible_Chapter .zef_verse_number')
    page_verses.each_with_index do |page_verse, verse_index|
      p_verse = page_verse.text.strip
      p_number = page_verse_numbers[verse_number].text.strip
      BibleVerse.create(language: language.id, 
                        version: version, 
                        book: Book.find(book_index), 
                        chapter: page_chapter.text.strip,
                        verse: p_number,
                        misc_data: p_verse,
                        verse_text: "#{p_number}. #{p_verse}"
                       )
    end
  end
end
