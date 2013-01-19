module CodeRay

  # Silent warnings
  module Encoders
    class Encoder
      def << token
        # unless @@CODERAY_TOKEN_INTERFACE_DEPRECATION_WARNING_GIVEN
        #   warn 'Using old Tokens#<< interface.'
        #   @@CODERAY_TOKEN_INTERFACE_DEPRECATION_WARNING_GIVEN = true
        # end
        self.token(*token)
      end
    end
  end

  # Add terminal scanner
  # author: Vincent Landgraf <setcool@gmx.de>
  # modified by Raul Murciano <raul@murciano.net>
  # licence: GPLv2.1
  module Scanners

    class Term < Scanner

      register_for :term

      def scan_tokens(tokens, options)
        prev = nil

        until eos?
          line = scan(/.*?(\n|\z)/)
          if line =~ /\A(\s*\$)/ # command
            tokens << [$1, :comment] # prompt
            line = line[($1.size)..-1]
            if comment_index = line.index('#')
              command = line[0..comment_index-1]
              comment = line[comment_index-1..-1]
              tokens << [command, :method] if command
              tokens << [comment, :comment] if comment
            else
              tokens << [line, :method]
            end
          else
            tokens << [line, :string]
          end
          prev = line
        end
        return tokens
      end
    end
  end
end


CodeRay::Scanners['java_script'].register_for :nodejs

module Rack
  class Codehighlighter
    def coderay(string)
      lang = 'unknown'
      refs = @opts[:pattern].match(string)  # extract language name
      if refs
        lang = refs[1]
        str = unescape_html(string.sub(@opts[:pattern], ""))
        "<pre class='CodeRay' lang='#{lang}'>#{::CodeRay.encoder(:html).encode str, lang}</pre>"
      else
        "<pre class='CodeRay' lang='#{lang}'>#{string}</pre>"
      end
    end
  end
end