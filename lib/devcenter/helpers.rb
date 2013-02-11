module Devcenter::Helpers

  def devcenter_base_url
    ENV['DEVCENTER_BASE_URL'] || 'https://devcenter.heroku.com'
  end

  def article_path(slug)
    "/articles/#{slug}"
  end

  def article_api_path(slug)
    "#{article_path(slug)}.json"
  end

  def search_api_path
    "/articles.json"
  end

  def article_url?(url)
    escaped_base_url = devcenter_base_url.gsub('/','\\/')
    url.match(/\A#{escaped_base_url}\/articles\/.+/)
    true
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

end