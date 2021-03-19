class CreateBibleVerses < ActiveRecord::Migration[6.1]
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
  end
end
