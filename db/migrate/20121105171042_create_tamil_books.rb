class CreateTamilBooks < ActiveRecord::Migration
  def change
    create_table :tamil_books do |t|
      t.string :name
      t.string :short_name
      t.references :book

      t.timestamps
    end
    add_index :tamil_books, :book_id
  end
end
