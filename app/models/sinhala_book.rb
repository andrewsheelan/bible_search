class SinhalaBook < ActiveRecord::Base
  belongs_to :book
  attr_accessible :name, :short_name, :book_id
end
