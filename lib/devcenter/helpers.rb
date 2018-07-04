require 'netrc'

module Devcenter::Helpers

  def devcenter_base_url
    ENV['DEVCENTER_BASE_URL'] || 'https://devcenter.heroku.com'
  end

  def broken_link_checks_path
    '/api/v1/private/broken-link-checks.json'
  end

  def article_path(slug)
    "/articles/#{slug}"
  end

  def article_api_path(slug)
    "#{article_path(slug)}.json"
  end

  def search_api_path
    "/api/v1/search.json"
  end

  def validate_article_path(id)
    "/api/v1/private/articles/#{id}/validate.json"
  end

  def update_article_path(id)
    "/api/v1/private/articles/#{id}.json"
  end

  def article_url?(url)
    escaped_base_url = devcenter_base_url.gsub('/','\\/')
    url.match?(/\A#{escaped_base_url}\/articles\/.+/)
  end

  def slug_from_article_url(url)
    return nil unless url
    url.split('/articles/').last.split('?').first.split('#').first
  end

  def md_file_path(slug)
    File.expand_path("#{slug}.md")
  end

  def html_file_path(slug)
    File.expand_path("#{slug}.html")
  end

  def write_file(filename, content)
    File.open(filename, 'w'){ |f| f.write(content) }
  end

  def get_oauth_token
    netrc = Netrc.read(netrc_path)
    user, token = netrc['api.heroku.com']
    abort 'Heroku credentials not found. Execute "heroku login" to create them.' unless token
    token
  end

  def netrc_path
    default = Netrc.default_path
    encrypted = default + ".gpg"
    if File.exists?(encrypted)
      encrypted
    else
      default
    end
  end
end
