require_relative 'version'

module Devcenter::GemVersionChecker

  def self.new_version_available?
    remote = last_remote_version
    remote && (Gem::Version.new(remote) > Gem::Version.new(Devcenter::VERSION))
  end

  def self.last_remote_version
    json = Excon.get('https://rubygems.org/api/v1/versions/devcenter.json').body
    versions = JSON.parse(json).map{ |v| v['number'] }
    versions.sort{ |a,b| Gem::Version.new(a) <=> Gem::Version.new(b) }.last
  rescue
    nil
  end

end