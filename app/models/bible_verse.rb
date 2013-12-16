class BibleVerse < ActiveRecord::Base
  belongs_to :language
  belongs_to :version
  belongs_to :book
  attr_accessible :chapter, :verse, :language_id, :version_id, :book_id, :verse_text, :misc_data
end
