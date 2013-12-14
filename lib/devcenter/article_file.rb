require 'devcenter-parser'

module Devcenter

  class ArticleFile

    attr_reader :metadata, :html, :content, :parsing_error, :toc

    def initialize(opts = {})
      @metadata = opts[:metadata] || OpenStruct.new
      @content = opts[:content] || ''
      markdown_flavour = @metadata.markdown_flavour || :maruku
      begin
        @html = ::DevcenterParser.to_html(@content, markdown_flavour.to_sym)
      rescue Exception => e
        @parsing_error = e.to_s
        @html = ''
      end
      @toc = Nokogiri::HTML(@html).search('h2')
    end

    def self.read(src_path)
      src = IO.read(src_path)
      metadata_yaml, content = src.split(/\r*\n\r*\n/, 2)
      metadata = OpenStruct.new YAML.load(metadata_yaml)
      markdown_flavour = metadata.markdown_flavour || :maruku
      new(metadata: metadata, content: content)
    end

  end

end