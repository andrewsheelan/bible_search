class Book < ActiveRecord::Base
  has_many :bible_verses
  has_one :tamil_book
  has_one :sinhala_book
end
