class AddVerseTextToBibleVerse < ActiveRecord::Migration[6.1]
  def change
    add_column :bible_verses, :verse_text, :string
  end
end
