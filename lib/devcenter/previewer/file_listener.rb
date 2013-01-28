module Devcenter::Previewer

  class FileListener
    require 'listen'

    def initialize(file_path, callback)
      dir = File.dirname(file_path)
      basename = File.basename(file_path)
      @listener = Listen.to(dir)
      @listener.filter(%r{#{basename}})
      @listener.change(&callback)
    end

    def start
      @thread = Thread.new { @listener.start }
    end

    def stop
      @listener.stop
      Thread.kill(@thread)
    end
  end

end