class CreateTamilBooks < ActiveRecord::Migration[6.1]
  def change
    create_table :tamil_books do |t|
      t.string :name
      t.string :short_name
      t.references :book

      t.timestamps
    end
  end
end
