class CreateSinhalaBooks < ActiveRecord::Migration[6.1]
  def change
    create_table :sinhala_books do |t|
      t.string :name
      t.string :short_name
      t.references :book

      t.timestamps
    end
  end
end
