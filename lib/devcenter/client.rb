require 'singleton'
require 'excon'

module Devcenter

  module Client
    include Devcenter::Helpers
    extend self

    def head(args)
      client.head(args)
    end

    def get(args)
      client.get(args)
    end

    def client
      @client ||= Excon.new(devcenter_base_url, :headers => { 'User-agent' => 'DevCenterCLI'})
    end
  end

end