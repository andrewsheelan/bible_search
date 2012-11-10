class CreateBibleVerses < ActiveRecord::Migration
  def change
    create_table :bible_verses do |t|
      t.references :language
      t.references :version
      t.references :book
      t.integer :chapter
      t.integer :verse
      t.string :misc_data

      t.timestamps
    end
    add_index :bible_verses, :language_id
    add_index :bible_verses, :version_id
    add_index :bible_verses, :book_id
  end
end
