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
      say 'Authenticate with your Heroku account:'
      email = ask('Email:    ')
      password = ask('Password: ') { |q| q.echo = '*' }
      response = Devcenter::Client.get_oauth_token(email, password)
      if response.access_denied?
        abort "Authentication error: bad credentials. Please try again."
      elsif response.ok?
        token = response.body['access_token']['token']
        push_article(token) if validate_article(token)
      else
        abort "Authentication error: #{response.body['message']}"
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
        say "The article \"#{@slug}\" is not valid:"
        abort errors.to_yaml.gsub(/\A(\-+)\n-/, '')
      else
        say "The article \"#{@slug}\" is valid."
      end
      errors.empty?
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
        say "\"#{@slug}\" pushed successfully."
      else
        error = response.body['error']
        abort "Error pushing \"#{@slug}\": #{error}"
      end
    end
  end
end