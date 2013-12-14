module Devcenter::Commands

  class Push < Base

    def initialize(*args)
      @slug = args[0].to_s.gsub(/.md\z/, '') # maybe the user provides the filename by mistake
      @md_path = md_file_path(@slug)
      super
    end

    def validate
      empty_slug = @slug.nil? || @slug.to_s.strip.empty?
      file_exists = !empty_slug && File.exists?(@md_path)
      if empty_slug
        @validation_errors << 'Please provide an article slug'
      elsif !file_exists
        @validation_errors << "Can't find #{@md_path} file - you may want to `devcenter pull #{@slug}`"
      end
    end

    def run
      @article = ::Devcenter::ArticleFile.read(@md_path)
      if @article.parsing_error
        abort "The content of #{@md_path} can't be parsed properly, fix it and try again."
      end
      if token = get_oauth_token
        display_broken_links(token)
        if validate_article(token)
          push_article(token)
        end
      end
    end

    def validate_article(token)
      article_id = @article.metadata.id
      article_params = {
        'article[content]' => @article.content,
        'article[title]' => @article.metadata.title,
        'article[parser]' => @article.metadata.parser || @article.metadata.markdown_flavour
      }
      response = Devcenter::Client.validate_article(token, article_id, article_params)
      errors = response.body
      if errors.any?
        say "The article \"#{@slug}\" can't be saved:"
        abort errors.to_yaml.gsub(/\A(\-+)\n-/, '')
      end
      errors.empty?
    end

    def display_broken_links(token)
      response = Devcenter::Client.check_broken_links(token, @article.content, @article.metadata.markdown_flavour)
      broken_links = response.body
      if broken_links.any?
        say "The article \"#{@slug}\" contains broken link/s:"
        broken_links.each{ |link| say("- [#{link['text']}](#{link['url']})") }
        say "\n"
      end
    end

    def push_article(token)
      article_id = @article.metadata.id
      article_params = {
        'article[content]' => @article.content,
        'article[title]' => @article.metadata.title,
        'article[parser]' => @article.metadata.parser || @article.metadata.markdown_flavour
      }
      response = Devcenter::Client.update_article(token, article_id, article_params)
      if response.ok?
        say "\"Article #{@slug}\" pushed successfully."
      else
        error = response.body['error']
        abort "Error pushing \"#{@slug}\": #{error}"
      end
    end    
  end
end