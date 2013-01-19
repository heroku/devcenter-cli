module Devcenter::Previewer

  class WebServer
    require 'thin'

    attr_reader :threaded

    def initialize(host, port, app, threaded = false)
      @host, @port = host, port
      Thin::Logging.silent = true
      @server = Thin::Server.new(@host, @port, app)
      @threaded = false
    end

    def start
      if threaded
        @thread = Thread.new { @server.start }
      else
        @server.start
      end
    end

    def stop
      @server.stop
      Thread.kill(@thread) if threaded
    end
  end

end