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
      response = Devcenter::Client.head(:path => path)
      if response.ok?
        log "Page found, opening"
        launchy = Launchy.open(devcenter_base_url + path)
        launchy.join if launchy.respond_to?(:join)
      elsif response.redirect?
        abort "Redirected to #{response.location}"
      elsif response.not_found?
        article_not_found!(@slug)
      end
    end

  end
end