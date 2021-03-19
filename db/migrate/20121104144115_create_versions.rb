class CreateVersions < ActiveRecord::Migration[6.1]
  def change
    create_table :versions do |t|
      t.string :name
      t.string :short_name

      t.timestamps
    end
  end
end
