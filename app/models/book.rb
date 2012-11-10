class Book < ActiveRecord::Base
  attr_accessible :name, :short_name
  has_many :bible_verses
  has_one :tamil_book
  has_one :sinhala_book
end
