class CreateSinhalaBooks < ActiveRecord::Migration
  def change
    create_table :sinhala_books do |t|
      t.string :name
      t.string :short_name
      t.references :book

      t.timestamps
    end
    add_index :sinhala_books, :book_id
  end
end
