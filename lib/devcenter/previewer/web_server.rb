module Devcenter::Previewer

  class WebServer
    require 'thin'

    def initialize(host, port, app)
      @host, @port = host, port
      Thin::Logging.silent = true
      @server = Thin::Server.new(@host, @port, app)
    end

    def start
      @thread = Thread.new { @server.start }
    end

    def stop
      @server.stop
      Thread.kill(@thread)
    end
  end

end