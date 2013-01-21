require 'excon'
require 'launchy'
require 'json'
require 'yaml'

module Devcenter::Commands

  class Base

    include Devcenter::Logger
    include Devcenter::Helpers

    def self.run(*args)
      command = self.new(*args)
    end

    def initialize(*args)
      @validation_errors = []
      validate
      if @validation_errors.any?
        @validation_errors.each{ |e| say e }
      else
        run
      end
    end

    def validate; end # add error messages to @validation_errors
    def run; end

    protected

    def article_not_found!(slug)
      message = ["No #{slug} article found."]
      suggestions = JSON.parse(Excon.get(search_api_url, :query => { :q => slug, :source => 'devcenter-cli' }).body)['devcenter']
      suggestions.select!{ |s| article_url?(s['full_url']) }
      suggestions.each{ |s| s['slug'] = slug_from_article_url(s['full_url']) }
      unless suggestions.empty?
        message << "Perhaps you meant one of these:"
        longest = suggestions.map {|suggestion| suggestion['slug'].size }.max
        suggestions.each do |suggestion|
          message << "  %-#{longest}s # %s" % [suggestion['slug'], suggestion['title']]
        end
      end
      say message.join("\n")
      exit
    end

  end
end