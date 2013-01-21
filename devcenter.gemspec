# encoding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'devcenter/version'

Gem::Specification.new do |gem|
  gem.name          = "devcenter"
  gem.version       = Devcenter::VERSION
  gem.authors       = ["Raul Murciano"]
  gem.email         = ["raul@heroku.com"]
  gem.description   = %q{CLI to interact with Heroku's Dev Center}
  gem.summary       = %q{CLI to interact with Heroku's Dev Center}
  gem.homepage      = "https://devcenter.heroku.com"

  gem.files         = `git ls-files`.split($/)
  gem.executables   = %w{ devcenter }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = %w{ lib vendor }
  gem.add_runtime_dependency('listen', '~> 0.7.2')
  gem.add_runtime_dependency('commander', '~> 4.1.3')
  gem.add_runtime_dependency('json', '~>1.7.6')
  gem.add_runtime_dependency('excon', '~>0.15.4')
  gem.add_runtime_dependency('launchy', '~>2.1.0')
  gem.add_runtime_dependency('maruku', '~>0.6.1')
  gem.add_runtime_dependency('nokogiri', '~>1.5.5')
  gem.add_runtime_dependency('coderay', '~>1.0.8')
  gem.add_runtime_dependency('thin', '~>1.5.0')
  gem.add_runtime_dependency('rack', '~>1.4.4')
  gem.add_runtime_dependency('rack-protection', '~>1.3.2')
  gem.add_runtime_dependency('tilt', '~>1.3.3')
end
