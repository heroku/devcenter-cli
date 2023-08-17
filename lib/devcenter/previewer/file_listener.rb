require_relative 'web_app'

module Devcenter::Previewer

  class FileListener
    require 'listen'

    def initialize(file_path)
      dir = File.dirname(file_path)
      basename = File.basename(file_path)
      @listener = Listen.to(dir) do |modified, added, removed|
        modified.each{ |f| Devcenter::Logger.log "File modified: #{f}" }
        WebApp.send_server_event
      end
      @listener.only(%r{#{basename}})
    end

    def start
      @thread = Thread.new { @listener.start }
    end

    def stop
      @listener.stop rescue ThreadError
      Thread.kill(@thread)
    end
  end

end
