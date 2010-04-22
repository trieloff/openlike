// TODO - add full support for the "open graph" meta elements
// TODO - add more specifics to each service, such as buzz "imageurl"
// TODO - add more services reddit, digg, ...
if (!window.OPENLIKE) {
	window.OPENLIKE = {
		assetHost: 'http://openlike.org',
		util: {
			update: function() {
				var obj = arguments[0], i = 1, len=arguments.length, attr;
				for (; i<len; i++) {
					for (attr in arguments[i]) {
						obj[attr] = arguments[i][attr];
					}
				}
				return obj;
			},
			escape: function(s) {
				return ((s == null) ? '' : s)
					.toString()
					.replace(/[<>"&\\]/g, function(s) {
						switch(s) {
							case '<': return '&lt;';
							case '>': return '&gt;';
							case '"': return '\"';
							case '&': return '&amp;';
							case '\\': return '\\\\';
							default: return s;
						}
					});
			},
			notundef: function(a, b) {
				return typeof(a) == 'undefined' ? b : a;
			}
		}
	};
}

if (!OPENLIKE.Widget) {
	OPENLIKE.Widget = function(cfg) {
		// Params for cfg
		//
		//   url -- string -- the url to share
		//   s -- array -- list of sites to share to
		//   title -- the title text (or none) to give the widget (default - 'Like this:')
		//   css -- string (or false) -- url for the css ('optional' -- *only used in first widget call*)
		var defaults = {
				s: ['facebook', 'hunch', 'twitter', 'google'],
				url: window.location.href,
				title: 'Like this:',
				css: OPENLIKE.assetHost + '/v1/openlike.css'
			},
			i, len, wrapper, title, list, li, a, source,
			css;
		cfg = OPENLIKE.util.update(defaults, cfg);

		// Add CSS
		if (!OPENLIKE.Widget._initialized) {
			OPENLIKE.Widget._initialized = true;
			if (cfg.css) {
				css = document.createElement('LINK');
				css.rel = 'stylesheet';
				css.type = 'text/css';
				css.href = cfg.css;
				(document.getElementsByTagName('HEAD')[0] || document.body).appendChild(css);
			}
		}

		// Get current script object
		var script = document.getElementsByTagName('SCRIPT');
		script = script[script.length - 1];

		// Build Widget
		wrapper = document.createElement('DIV');
		wrapper.className = 'openlike';
		if (cfg.title) {
			title = document.createElement('P');
			title.innerHTML = OPENLIKE.util.escape(cfg.title);
			wrapper.appendChild(title);
		}

		list = document.createElement('UL');
		console.log('SOURCES', OPENLIKE.Sources);
		console.log('to check:', cfg.s);
		for (i=0, len=cfg.s.length; i<len; i++) {
			console.log(cfg.s[i]);
			if (source = OPENLIKE.Sources[cfg.s[i]]) {
				source = OPENLIKE.prepSource(cfg.s[i], source);
				li = document.createElement('LI');
				console.log('source is', source);
				if (source.html) {
					a = source.html(cfg);
				} else {
					a = document.createElement('A');
					a.className = source.klass;
					a.href = '#';
					a.innerHTML = OPENLIKE.util.escape(source.name);
					if (source.title) a.title = source.title;
					if (source.like) a.onclick = source.like(cfg);
					if (source.basicLink) {
						a.href = source.basicLink(a, cfg);
						if (source.popup) {
							a.onclick = function(url, target, attrs) {
								return function() {
									window.open(url, target, attrs);
									return false;
								};
							}(a.href, source.popup.target, source.popup.attrs);
						}
						a.target = source.target;
					}
				}
				li.appendChild(a);
				list.appendChild(li);
			}
		}
		wrapper.appendChild(list);

		script.parentNode.insertBefore(wrapper, script);
		wrapper = title = list = li = script = source = null;
	};

	OPENLIKE.prepSource = function(name, source) {
		source = OPENLIKE.util.update({}, source);
		source.name = name;
		source.target = OPENLIKE.util.notundef(source.target, '_blank');
		source.klass = 'openlike-' + OPENLIKE.util.escape(name);
		if (source.popup) {
			source.popup.target = OPENLIKE.util.notundef(source.popup.target, '_blank');
			source.popup.attrs = OPENLIKE.util.notundef(source.popup.attrs, 'width=360,height=360');
		}
		return source;
	};

	OPENLIKE.Sources = {
		google: {
			url: 'http://google.com',
			basicLink: function(a, cfg) {
				var url = cfg.url,
					msg = 'I like this... ' + document.title;
					//srcURL -- e.g. http://domain.com/
				return 'http://www.google.com/buzz/post?message=' + encodeURIComponent(msg) + '&amp;url=' + encodeURIComponent(url);
			},
			title: 'Buzz this like.'
		},
		hunch: {
			url: 'http://hunch.com',
			basicLink: function(a, cfg) {
				var url = cfg.url,
					title = document.title;
				return 'http://hunch.com/openlike/?url=' + encodeURIComponent(url) + '&amp;title=' + encodeURIComponent(title);
			},
			popup: {
				target: '_blank',
				attrs: 'width=610,height=600'
			},
			title: 'Add this to your Hunch taste profile.'
		},
		twitter: {
			url: 'http://twitter.com',
			basicLink: function(a, cfg) {
				var msg = 'I like this: ' + cfg.url + ' #openlike';
				return 'http://twitter.com/home?status=' + encodeURIComponent(msg);
			},
			title: 'Tweet this like.'
		},
		facebook: {
			html: function(cfg) {
				// <iframe src="http://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fdevelopers.facebook.com%2F&amp;layout=button_count&amp;show_faces=false&amp;width=25&amp;action=like&amp;colorscheme=light" scrolling="no" frameborder="0" allowTransparency="true" style="border:none; overflow:hidden; width:25px; height:px"></iframe>
				var elt = document.createElement('IFRAME'),
					width = 53;
				elt.src = 'http://www.facebook.com/plugins/like.php?href=' + encodeURIComponent(cfg.url) + '&amp;layout=button_count&amp;show_faces=false&amp;width=' + width + '&amp;action=like&amp;colorscheme=light';
				elt.scrolling = "no";
				elt.frameBorder = "0";
				elt.allowTransparency = "true";
				elt.style.border = 'none';
				elt.style.overflow = 'hidden';
				elt.style.width = width + 'px';
				elt.style.height = '24px';
				elt.style.padding = '1px 0 0 0';
				return elt;
			},
			url: 'http://facebook.com',
			basicLink: function(a, cfg) {
				var url = cfg.url,
					title = document.title;
				return 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(url) + '&amp;t=' + encodeURIComponent(title);
			}
		}
	};
}