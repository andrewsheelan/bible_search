require 'open-uri'
sn_snv_bible_index = Nokogiri::HTML(open("http://gospelgo.com/a/sinhala/Sinhala%20Bible%20-%20Unicode.htm"))
books_data = sn_snv_bible_index.css('.bevelmenu li a')

# Code to create the books in the bible
books_data.each_with_index do |book_data, index|
  book_name = /([A-z 0-9]*)$/.match(book_data.attr('href'))[1] 
  unless /Testament/.match(book_name)
    book = Book.find_by_name(book_name)
    puts book_name
    SinhalaBook.create(name: book_data.text, book_id: book.id)
  end
end
