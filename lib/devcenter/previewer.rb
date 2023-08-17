# encoding: utf-8
require_relative 'previewer/web_app'
require_relative 'previewer/web_server'
require_relative 'previewer/file_listener'

module Devcenter::Previewer
  extend self

  def preview(slug, md_path, host, port)
    Runner.new(slug, md_path, host, port).run
  end

  class Runner
    attr_reader :slug, :md_path, :host, :port, :url

    def initialize(slug, md_path, host, port)
      @slug = slug
      @md_path = md_path
      @host = host
      @port = port
      @url = "http://#{@host}:#{@port}/#{@slug}"
      @listener = init_listener
      @server = init_server
    end

    def run
      start
      @running = true
      [:INT, :TERM].each do |signal|
        trap(signal) do
          stop
          exit
        end
      end
      sleep 1 while running?
    end

    private

    def running?
      @running
    end

    def init_server
      WebServer.new(host, port, WebApp)
    end

    def init_listener
      FileListener.new(md_path)
    end

    def start
      @server.start
      @listener.start
      say "\nLive preview for #{slug} available in #{url}"
      say "It will refresh when you save #{md_path}"
      say "Press Ctrl+C to exit...\n"
      Launchy.open(url)
    end

    def stop
      @server.stop
      @listener.stop
      say "\nPreview finished."
      @running = false
    end
  end
end
