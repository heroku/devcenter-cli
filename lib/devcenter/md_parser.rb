# encoding: utf-8
require 'maruku'
require 'nokogiri'
require 'coderay'
require 'sanitize'

module Devcenter::MdParser
  class InvalidMarkdownError < Exception; end
  class InvalidRawHTMLError < Exception; end

  def self.to_html(markdown)
    html = to_unsanitized_html(markdown)
    html = sanitize(html)
    highlight(html)
  end

  def self.to_unsanitized_html(markdown)
    html = Maruku.new(markdown, :on_error => :raise).to_html
    html = Nokogiri::HTML::DocumentFragment.parse(html).to_html(:encoding => 'utf-8')
    verify_raw_html(html)
    html = underscores_to_dashes_in_subheader_anchors(html)
  rescue InvalidRawHTMLError => e
    raise InvalidMarkdownError, e.message
  rescue => e
    raise InvalidMarkdownError, parse_maruku_error(e.message)
  end

  def self.sanitize(html)
    Sanitize.clean(html, sanitize_config)
  end

  def self.sanitize_config
    return @@sanitize_config if defined?(@@sanitize_config)
    config = Sanitize::Config::RELAXED
    config[:attributes][:all] += %w{ id class style name width height border align }
    config[:attributes]['a'] += %w{ target }
    config[:elements] += %w{ div span hr tt }

    # embedded videos
    config[:attributes][:all] += %w{ value src type allowscriptaccess allowfullscreen }
    config[:elements] += %w{ object param embed }
    config[:add_attributes] = {
      'object' => {'allowscriptaccess' => 'never'},
      'embed' => {'allowscriptaccess' => 'never'},
      'param' => {'allowscriptaccess' => 'never'}
    }

    @@sanitize_config = config.merge({remove_contents: true, allow_comments: true})
  end

  def self.highlight(html)
    element = "pre>code"
    pattern = /\A\s*:::(\w+)\s*\n/i

    doc = Nokogiri::HTML(html, nil, 'UTF-8')
    nodes = doc.search(element)
    nodes.each do |node|
      s = node.inner_html || "[++where is the code?++]"
      highlighted = to_coderay(s, pattern)
      node.parent.swap(highlighted)
    end
    doc.to_html
  end

  def self.unescape_html(string)
    string.to_s.gsub(/&#x000A;/i, "\n").gsub("&lt;", '<').gsub("&gt;", '>').gsub("&amp;", '&')
  end

  def self.to_coderay(string, pattern)
    lang = 'unknown'
    refs = pattern.match(string)  # extract language name
    if refs
      lang = refs[1]
      str = unescape_html(string.sub(pattern, ""))
      "<pre class='CodeRay'>#{::CodeRay.encoder(:html).encode str, lang}</pre>"
    else
      "<pre class='CodeRay'>#{string}</pre>"
    end
  end

  def self.underscores_to_dashes_in_subheader_anchors(html)
    doc = Nokogiri::HTML::DocumentFragment.parse(html)

    doc.css("h2,h3,h4,h5,h6").each do |node|
      if node.attributes['id'] && node.attributes['id'].value
        node.attributes['id'].value = node.attributes['id'].value.gsub(/_+/,'-')
      end
    end
    doc.to_html
  end

  def self.valid_markdown?(markdown)
    return true, to_html(markdown)
  rescue InvalidMarkdownError => e
    return false, e.message
  end

  def self.verify_raw_html(html)
    raise(InvalidRawHTMLError, parse_raw_html_error(html)) if invalid_raw_html?(html)
  end

  def self.invalid_raw_html?(html)
    html.to_s.include?('markdown-html-error')
  end

  def self.parse_maruku_error(error_message)
    lines = error_message.to_s.split("\n")
    return lines unless lines.size > 1
    msg = lines[4].gsub(/\A\|(\s)+|EOF\Z/,'').strip
    code = lines[6].gsub(/\A\|(\s)+|EOF\Z/,'').strip
    "#{msg} in \"#{code}\""
  end

  def self.parse_raw_html_error(html)
    broken_html = html.match(/REXML could not parse this XML\/HTML\:(.+)<\/pre>/m)[1].strip rescue nil
    broken_html.blank? ? "Contains broken raw HTML." : "This raw HTML is invalid: #{CGI.unescapeHTML(broken_html)}"
  end
end