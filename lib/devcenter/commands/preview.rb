module Devcenter::Commands

  class Preview < Base

    def initialize(*args)
      @slug = args[0].to_s.gsub(/.md\z/, '') # maybe the user provides the filename by mistake
      @host = args[1]
      @port = args[2]
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
      ::Devcenter::Previewer.preview(@slug, @md_path, @host, @port)
    end

  end
end