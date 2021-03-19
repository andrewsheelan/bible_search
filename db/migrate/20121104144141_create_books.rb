class CreateBooks < ActiveRecord::Migration[6.1]
  def change
    create_table :books do |t|
      t.string :name
      t.string :short_name
      t.string :testament

      t.timestamps
    end
  end
end
