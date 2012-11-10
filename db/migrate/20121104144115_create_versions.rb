class CreateVersions < ActiveRecord::Migration
  def change
    create_table :versions do |t|
      t.string :name
      t.string :short_name

      t.timestamps
    end
  end
end
