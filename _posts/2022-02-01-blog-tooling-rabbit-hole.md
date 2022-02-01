---
title: Down the blog tooling rabbit hole
---

I decided to dive into blogging again.
This time, I'm trying out static site generators.
I'm still trying to figure out how best to do this; stuff like layout and URLs might change around a lot.

My lowest-friction option at the moment seems to be GitHub Pages.
Benefits include: free hosting, Markdown input, and some support for math formatting.
There are a bunch of tradeoffs involved, and I may revisit this decision later.

This turned into a little bit of an adventure.
I wanted to be able to preview pages locally, so I needed to reproduce some semblance of the GitHub Pages build environment.
I needed to quickly learn some quirks of Ruby, gems, Bundler, Jekyll, Liquid, kramdown, MathJax, and GitHub Pages itself.
Most of these technologies are completely new to me.
It's a bit of a Rube Goldberg machine, but not as complicated as some others I've encountered.

**Note**:
This assumes a recent version of `github-pages` (223) and MathJax (3.x).
There are some older guides out there that no longer work quite as well due to recent changes in both kramdown and MathJax, or they work around problems that are no longer relevant.

## Jekyll Installation details

GitHub Pages defaults to Jekyll with a small set of supported themes.
Plugins are limited, so some other themes in the Jekyll ecosystem aren't usable without a custom build process.
Fortunately, MathJax requires only that a single JavaScript file be loaded in any HTML page that uses it.

Jekyll is written in Ruby.
The version of macOS I run ships with a recent enough version of Ruby, so I don't have to get that through Homebrew or something.
Apparently, if I want to install Ruby gems without stuff getting written to system directories, etc., I probably have to use Bundler.
Fortunately, that's also in my version of macOS.

GitHub Pages also makes it relatively easy to install the correct versions of Jekyll and all the additional dependencies of GitHub Pages: just install the `github-pages` gem.

The following is probably a bit more tedious than directly installing the Jekyll gem, but at least I have some hope that it's relatively well-contained.
It's adapted from this [Jekyll Bundler tutorial](https://jekyllrb.com/tutorials/using-jekyll-with-bundler/), with a corrected `bundle config` invocation.
(In my version of Bundler, the command in the tutorial tries to set a config global variable named `set` to the value `"--local path vendor/bundle"`!)

```
bundle init
bundle config --local path vendor/bundle
bundle add github-pages
bundle exec jekyll new --force --skip-bundle .
```

Edit the `Gemfile` to restore `github-pages`, because `jekyll new --force` overwrites it.

```
bundle update
```

to get the all the dependencies resolved again.

## Setting up MathJax

The [MathJax documentation](https://www.mathjax.org/#gettingstarted) says to use

``` html
<script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
```

to load MathJax.

Instead, I used the simpler

``` html
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
```

because I don't need MathML support (the `-mml` fragment of the filename), nor do I currently want polyfill for supporting older browsers.
Hopefully this makes pages loads a little lighter.

The default Markdown engine for GitHub Pages is kramdown, which uses `$$` delimiters for math blocks.
The contents of math blocks pass through (mostly?) unmodified, where the MathJax JavaScript goes and does its magic inside the browser after the page is loaded.

## Template support

I added the following to a local copy of `_includes/head.html` (which file to modify depends on the details of the Jekyll theme being used, but the idea is to inject it into the HTML `<head>` element):

```liquid
{%- raw -%}
  {%- if page.mathjax -%}
    {%- include mathjax_support.html -%}
  {%- endif -%}
{% endraw %}
```

and created a new `_includes/mathjax_support.html` with the `<script>` code above to load the MathJax JavaScript from a CDN.

Now, any page that includes the following front matter:

``` yaml
---
mathjax: true
---
```

will be able to render math using MathJax.

## Results

Here is a [test page]({% link test-math.md %}) showing MathJax working (hopefully).

## Drawbacks

I don't see any easy way to do a GitHub Pages build variant that includes draft posts.
I might want to do this in the future, so that I can semi-publicly publish draft posts for review.
Also, I have yet to decide whether I want to have draft content in the public repository at all, or whether I want a separate private repository for it.

I would like to use categories for my posts, because I plan to blog about several topics with possibly different audiences.
With the available themes, there isn't an easy way to generate index pages for categories or tags, which seems unfortunate for what's notionally a blogging platform.
I guess the main focus of GitHub Pages is for documentation for projects hosted on GitHub, so functionality for blogging is not a major priority.

## Resources

Official references

* [GitHub Pages](https://pages.github.com)
* [Jekyll](https://jekyllrb.com/)
* [Liquid](https://shopify.github.io/liquid/)
* [MathJax](https://www.mathjax.org/)

Some other guides (in various states of being outdated)

* [Using mathjax on GitHub Pages with Jekyll](https://alanduan.me/random/mathjax/)
* [Upgrading to MathJax 3.0 after the Kramdown update in Github Pages](https://chris-said.io/2020/09/05/upgrading-to-mathjax-3-after-the-kramdown-update-in-github-pages/)
* [Write LaTeX Equations in Jekyll Using MathJax & Kramdown](https://lyk6756.github.io/2016/11/25/write_latex_equations.html)
