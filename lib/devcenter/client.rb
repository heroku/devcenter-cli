require 'singleton'
require 'excon'
require 'base64'

module Devcenter

  module Client
    include Devcenter::Helpers
    extend self

    def validate_article(token, article_id, article_params)
      form = URI.encode_www_form(article_params)
      auth_request(:post, token, path: validate_article_path(article_id), body: form, :headers => { "Content-Type" => "application/x-www-form-urlencoded" })
    end

    def update_article(token, article_id, article_params)
      form = URI.encode_www_form(article_params)
      auth_request(:put, token, path: update_article_path(article_id), body: form, :headers => { "Content-Type" => "application/x-www-form-urlencoded" })
    end

    def head(args)
      client.head(args)
    end

    def get(args)
      client.get(args)
    end

    def put(args)
      client.put(args)
    end

    def auth_request(method, token, args)
      args[:headers] ||= {}
      args[:headers].merge!(default_headers)
      args[:headers]["Authorization"] = "Basic #{encode64(token)}"
      client.send(method, args)
    end

    def client
      @client ||= Excon.new(devcenter_base_url, :headers => default_headers)
    end

    def default_headers
      {'User-agent' => 'DevCenterCLI'}
    end

    def get_oauth_token(email, password)
      auth = encode64("#{email}:#{password}")
      Excon.post('https://api.heroku.com/oauth/authorizations',
                  headers: {
                    "Content-Type" => "application/json",
                    "Accept" => "application/vnd.heroku+json; version=3",
                    "Authorization" => "Basic #{auth}"
                })
    end
  
    def encode64(str)
      Base64.encode64(str).strip
    end
  end

end