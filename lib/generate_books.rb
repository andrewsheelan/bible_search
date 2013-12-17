  File.open("vendor/bible/json/books.json", "w+") do |f|
     f.write(Book.pluck(:name).to_json)
  end


