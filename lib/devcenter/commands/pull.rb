module Devcenter::Commands

  class Pull < Base

    def initialize(*args)
      @slug = slug_from_article_url(args[0])
      @force_overwrite = args[1]
      super
    end

    def validate
      unless @slug && !@slug.strip.empty?
        @validation_errors << 'Please provide an article slug or full (e.g: ps or https://devcenter.heroku.com/articles/ps)'
      end
    end

    def run
      response = Devcenter::Client.get(path: article_api_path(@slug))
      article_received = response.ok? && response.body['article'] && response.body['article']['id']
      article_not_found!(@slug) unless article_received

      article = response.body['article']
      metadata = {'title' => article['title'], 'id' => article['id']}
      file_path = md_file_path(@slug)

      unless @force_overwrite
        cancel_save = File.exists?(file_path) && !agree("The file #{file_path} already exists - overwrite? (yes/no)")
        return if cancel_save
      end

      file_content = [Psych.dump(metadata), article['content']].join("\n\n")
      write_file(file_path, file_content)
      say "\"#{metadata['title']}\" article saved as #{file_path}"
    end

  end
end
