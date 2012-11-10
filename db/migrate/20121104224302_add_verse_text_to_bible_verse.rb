class AddVerseTextToBibleVerse < ActiveRecord::Migration
  def change
    add_column :bible_verses, :verse_text, :string
  end
end
