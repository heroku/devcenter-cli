#!/usr/bin/env ruby

require 'rubygems'
require 'commander/import'

program :version, Devcenter::VERSION
program :description, "CLI to interact with Heroku's Dev Center"

require_relative './commands'

command :open do |c|
  c.syntax = 'devcenter open [options]'
  c.summary = 'Open the article with the given slug in the default browser'
  c.description = c.summary
  c.example 'devcenter open process-model', 'Opens https://devcenter.heroku.com/articles/process-model in the default browser'
  c.option '--debug', 'Output internal log to help debugging'
  c.action do |args, options|
    options.default :debug => false
    Devcenter::Logger.active = options.debug
    Devcenter::Commands::Open.run(args[0])
  end
end

command :pull do |c|
  c.syntax = 'devcenter pull [options]'
  c.summary = 'Save an editable copy of an article in your current directory'
  c.description = c.summary
  c.example 'devcenter pull process-model', 'Saves the content of the article with the "process-model" slug to a local process-model.md file in the current directory'
  c.option '--force', 'Skip confirmation and overwrite existing local file'
  c.option '--debug', 'Output internal log to help debugging'
  c.action do |args, options|
    options.default :force => false, :debug => false
    Devcenter::Logger.active = options.debug
    Devcenter::Commands::Pull.run(args[0], options.force)
  end
end

command :preview do |c|
  c.syntax = 'devcenter preview [options]'
  c.summary = 'Opens a live preview for a given article file'
  c.description = c.summary
  c.example 'devcenter preview process-model', 'Opens a live preview of the local process-model.md file'

  c.option '--host HOST', String, 'Host where the preview will be available'
  c.option '--port PORT_NUMBER', Integer, 'Port where the preview will be available'
  c.option '--debug', 'Output internal log to help debugging'
  c.action do |args, options|
    options.default :host => '127.0.0.1', :port => 3000, :debug => false
    Devcenter::Logger.active = options.debug
    Devcenter::Commands::Preview.run(args[0], options.host, options.port)
  end
end
