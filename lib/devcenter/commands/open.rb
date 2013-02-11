module Devcenter::Commands

  class Open < Base

    def initialize(*args)
      @slug = args[0]
      super
    end

    def validate
      unless @slug && !@slug.strip.empty?
        @validation_errors << 'Please provide a slug (e.g: ps is the slug for https://devcenter.heroku.com/articles/ps)'
      end
    end

    def run
      path = article_path(@slug)
      log "Connecting to #{path}"
      head = Devcenter::Client.head(:path => path)
      case head.status
      when 200
        log "Page found, opening"
        launchy = Launchy.open(devcenter_base_url + path)
        launchy.join if launchy.respond_to?(:join)
      when 301, 302
        say "Redirected to #{head.headers['Location']}"
      when 404
        article_not_found!(@slug)
      end
    end

  end
end