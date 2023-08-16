lib = File.expand_path('lib', __dir__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'devcenter/version'

Gem::Specification.new do |gem|
  gem.name          = 'devcenter'
  gem.version       = Devcenter::VERSION
  gem.authors       = ['Heroku']
  gem.email         = ['heroku-front-end@salesforce.com']
  gem.description   = %q(CLI to interact with Heroku's Dev Center)
  gem.summary       = %q(CLI to interact with Heroku's Dev Center)
  gem.homepage      = 'https://devcenter.heroku.com'

  gem.files         = `git ls-files`.split($/)
  gem.executables   = %w[devcenter]
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = %w[lib]
  gem.add_runtime_dependency('coderay', '~> 1.1.3')
  gem.add_runtime_dependency('commander', '~> 4.6')
  gem.add_runtime_dependency('devcenter-parser', '~>2.0')
  gem.add_runtime_dependency('excon', '~> 0.100.0')
  gem.add_runtime_dependency('json', '~> 2.3.1')
  gem.add_runtime_dependency('launchy', '~> 2.4.3')
  gem.add_runtime_dependency('listen', '~> 3.4.1')
  gem.add_runtime_dependency('netrc', '~> 0.11.0')
  gem.add_runtime_dependency('rack', '~> 1.6.13')
  gem.add_runtime_dependency('rack-highlighter', '~> 0.2.1')
  gem.add_runtime_dependency('rack-protection', '~> 1.5.5')
  gem.add_runtime_dependency('sinatra', '~> 1.4.8')
  gem.add_runtime_dependency('thin', '~> 1.8.2')
  gem.add_runtime_dependency('tilt', '~> 1.4.1')
end
