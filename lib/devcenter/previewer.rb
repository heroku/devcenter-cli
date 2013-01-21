# encoding: utf-8
require_relative 'previewer/web_app'
require_relative 'previewer/web_server'
require_relative 'md_parser'
require_relative 'previewer/file_listener'

module Devcenter::Previewer

  extend self

  def preview(slug, md_path, host, port)
    server = WebServer.new(host, port, WebApp, true)
    file_listener_callback = Proc.new do |modified, added, removed|
      modified.each{ |f| Devcenter::Logger.log "File modified: #{f}" }
      WebApp.send_server_event
    end

    listener = FileListener.new(md_path, file_listener_callback)

    [:INT, :TERM].each do |signal|
      trap(signal) do
        listener.stop
        server.stop
        say "\nPreview finished."
        exit
      end
    end
    listener.start
    url = "http://#{host}:#{port}/#{slug}"
    say "\nLive preview for #{slug} available in #{url}"
    say "It will refresh when you save #{md_path}"
    say "Press Ctrl+C to exit...\n"
    Launchy.open(url)
    server.start
  end

end
