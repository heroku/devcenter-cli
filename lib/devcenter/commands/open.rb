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
      url = article_url(@slug)
      head = Excon.head(url)
      case head.status
      when 200
        say("Opening #{@slug} docs")
        launchy = Launchy.open(url)
        if launchy.respond_to?(:join)
          launchy.join
        end
      when 301, 302
        say "Redirected to #{head.headers['Location']}"
      when 404
        article_not_found!(@slug)
      end
    end

  end
end