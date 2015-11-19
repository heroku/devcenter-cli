require 'singleton'
require 'excon'
require 'base64'

module Devcenter

  module Client

    class Response
      def initialize(response)
        @status, @body, @headers = response.status, response.body, response.headers
      end

      def ok?
        [200, 201].include?(@status)
      end

      def redirect?
        [301, 302].include?(@status)
      end

      def not_found?
        @status == 404
      end

      def access_denied?
        @status == 401
      end

      def body
        JSON.parse(@body)
      end

      def location
        @headers['Location']
      end
    end

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

    def check_broken_links(token, content)
      form = URI.encode_www_form({content: content})
      auth_request(:post, token, path: broken_link_checks_path, body: form, :headers => { "Content-Type" => "application/x-www-form-urlencoded" })
    end

    def response(request_call)
      Response.new request_call
    end

    def head(args)
      response client.head(args)
    end

    def get(args)
      response client.get(args)
    end

    def put(args)
      response client.put(args)
    end

    def auth_request(method, token, args)
      args[:headers] ||= {}
      args[:headers].merge!(default_headers)
      args[:headers]["Authorization"] = "Basic #{encode64(token)}"
      response client.send(method, args)
    end

    def client
      @client ||= Excon.new(devcenter_base_url, :headers => default_headers)
    end

    def default_headers
      {'User-agent' => 'DevCenterCLI'}
    end

    def get_oauth_token(email, password)
      auth = encode64("#{email}:#{password}")
      response Excon.post('https://api.heroku.com/oauth/authorizations',
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
