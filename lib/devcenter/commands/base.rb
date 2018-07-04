require 'yaml'
require 'excon'
require 'json'
require 'launchy'

module Devcenter::Commands

  class Base

    include Devcenter::Logger
    include Devcenter::Helpers

    def self.run(*args)
      if Devcenter::GemVersionChecker.new_version_available?
        say "devcenter has a new version available, please update with: gem install devcenter"
        return unless agree('Continue executing your command? (yes/no)')
      end

      command = self.new(*args)
    end

    def initialize(*args)
      @validation_errors = []
      validate
      if @validation_errors.any?
        @validation_errors.each{ |e| say e }
        abort
      else
        run
      end
    end

    def validate; end # add error messages to @validation_errors
    def run; end

    protected

    def article_not_found!(slug)
      message = ["No #{slug} article found."]
      response = Devcenter::Client.get(path: search_api_path, query: { query: slug })
      suggestions = response.body['results']
      suggestions.select! { |result| article_url?(result['full_url']) }
      unless suggestions.empty?
        message << "Perhaps you meant one of these:"
        longest = suggestions.map {|suggestion| suggestion['slug'].size }.max
        suggestions.each do |suggestion|
          message << "  %-#{longest}s # %s" % [suggestion['slug'], suggestion['title']]
        end
      end
      abort message.join("\n")
    end

  end
end
