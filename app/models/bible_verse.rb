class BibleVerse < ActiveRecord::Base
  belongs_to :language
  belongs_to :version
  belongs_to :book
end
