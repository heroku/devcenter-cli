require 'sinatra'
require 'rack/highlighter'

module Devcenter::Previewer

  class WebApp < Sinatra::Base

    use Rack::Highlighter, :coderay, { misc: { :css => :class, :element => "pre>code" } }

    include Devcenter::Logger

    set :logging, false
    set :connections, []
    set :public_folder, File.dirname(__FILE__)
    set :views, File.join(File.dirname(__FILE__), 'views')

    helpers do
      include Devcenter::Helpers
    end

    get '/favicon.ico' do
    end

    get '/stream', provides: 'text/event-stream' do
      stream :keep_open do |conn|
        settings.connections << conn
        log "New incoming connection (#{settings.connections.size} open)"

        # refresh connection before browser times out
        EventMachine::PeriodicTimer.new(20) do
          log "Refreshing connection"
          conn << ":refreshing \n\n"
        end

        conn.callback do
          settings.connections.delete(conn)
          log "Connection closed locally (#{settings.connections.size} open)"
        end

        conn.errback do
          conn.close
          settings.connections.delete(conn)
          log "Connection closed externally (#{settings.connections.size} open)"
        end
      end
    end

    get '/:slug' do
      log "Local article requested: #{params[:slug]}"
      src_path = File.join(Dir.pwd, "#{params[:slug]}.md")
      if File.exists?(src_path)
        log "Parsing"
        @article = parse_article(src_path)
        @page_title = @article.metadata.title
        log "Serving"
        erb :article
      else
        @referrer_url = request.referrer
        @page_title = 'Not found'
        erb :not_found
      end
    end

    def parse_article(src_path)
      article = OpenStruct.new
      src = IO.read(src_path)
      metadata_yaml, article.content = src.split(/\r*\n\r*\n/, 2)
      article.metadata = OpenStruct.new YAML.load(metadata_yaml)
      begin
        article.html = ::Devcenter::MdParser.to_html(article.content)
      rescue Exception => e
        article.error = e.to_s
      end
      article
    end

    def self.send_server_event
      Devcenter::Logger.log "Serving server side event to #{settings.connections.size} connections"
      settings.connections.each do |conn|
        conn << "data: reload\n\n"
      end
    end
  end
end