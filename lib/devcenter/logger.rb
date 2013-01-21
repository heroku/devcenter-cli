module Devcenter::Logger

  extend self

  def self.active=(bool)
    @@active = bool
  end

  def self.active?
    !!@@active
  end

  def log(str)
    puts "devcenter gem: #{str}" if Devcenter::Logger.active?
  end

end
