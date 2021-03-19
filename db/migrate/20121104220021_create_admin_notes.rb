class CreateAdminNotes < ActiveRecord::Migration[6.1]
  def self.up
    create_table :admin_notes do |t|
      t.string :resource_id, :null => false
      t.string :resource_type, :null => false
      t.references :admin_user, :polymorphic => true
      t.text :body
      t.timestamps
    end
  end

  def self.down
    drop_table :admin_notes
  end
end
