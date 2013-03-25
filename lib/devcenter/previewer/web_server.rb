module Devcenter::Previewer

  class WebServer
    require 'thin'

    def initialize(host, port, app)
      @host, @port = host, port
      Thin::Logging.silent = true
      @server = Thin::Server.new(@host, @port, app)
    end

    def start
      @server.start
    end

    def stop
      @server.stop
    end
  end

end