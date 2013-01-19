module Devcenter::Previewer

  class WebApp < Sinatra::Base

    set :logging, false
    set connections: []
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
        conn.callback { settings.connections.delete(conn) } # connection closed properly
        conn.errback do # connection closed due to an error
          conn.close
          settings.connections.delete(conn)
        end
      end
    end

    get '/:slug' do
      src_path = File.join(Dir.pwd, "#{params[:slug]}.md")
      @article = parse_article(src_path)
      erb :article
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
      settings.connections.each do |conn|
        conn << "data: reload\n\n"
      end
    end
  end
end