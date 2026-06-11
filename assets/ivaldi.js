var FPZendesk = (function($) {
	var loaded = false,
		scrolloffset;

	function init() {
		setupSearchFrontpage();

		jQuery('[data-toggle-category] h3').click(function(event) {
			event.preventDefault();
			if (
				$(this)
					.parent()
					.hasClass('open')
			) {
				$(this)
					.parent()
					.removeClass('open');
				$(this)
					.parent()
					.animate(
						{ height: '44px' },
						{ duration: 200, queue: false }
					);
			} else {
				$(this)
					.parent()
					.addClass('open');
				var height =
					44 +
					$(this)
						.parent()
						.find('.article-list')
						.outerHeight();
				$(this)
					.parent()
					.animate(
						{ height: height },
						{ duration: 200, queue: false }
					);
			}
		});

		jQuery('.c-nav__toggle').on('click', function(e) {
			e.preventDefault();
			jQuery('.c-nav__toggle').toggleClass('active');
			jQuery('body').toggleClass('open');
			jQuery('.c-cookie-bar').remove();
			jQuery('.c-search-popover--active').removeClass(
				'c-search-popover--active'
			);
			jQuery('body').removeClass('u-popover-active');
		});
	}

	function setupSearchFrontpage() {
		var searchContainer = $('.c-home-search');
		if ($(window).width() > searchContainer.outerWidth()) {
			var offset = ($(window).width() - searchContainer.outerWidth()) / 2;
			searchContainer.css({
				'margin-left': '-' + offset + 'px',
				'margin-right': '-' + offset + 'px'
			});
		} else {
			searchContainer.css({
				'margin-left': '0px',
				'margin-right': '0px'
			});
		}

		$(document).on('keyup', '[data-search] input[type="search"]', function(
			e
		) {
			e.preventDefault();
			if ($('.algolia-autocomplete-appended').length < 1) {
				$('.algolia-autocomplete .aa-dropdown-menu').append(
					'<div class="algolia-autocomplete-appended"><a target="_blank" href="https://www.fairphone.com/en/?type=&s=" class="btn btn-default action-button btn-lg btn-block btn-more-search">View more results</a></div>'
				);
			}
			if ($('.btn-more-search').length > 0) {
				var val = $('[data-search] input[type="search"]').val();
				$('.btn-more-search').attr(
					'href',
					'https://www.fairphone.com/en/?type=&s=' + val
				);
			}
		});
	}

	function scrollSearch() {
		if (loaded && $('.c-searchform').length > 0) {
			if (
				$(window).scrollTop() >= scrolloffset &&
				$('.c-searchform--fixed').length < 1
			) {
				var fakeHeight = $('.c-searchform').outerHeight();
				$('.c-searchform').after(
					'<div class="c-searchform--fake" style="height: ' +
						fakeHeight +
						'px"></div>'
				);
				$('.c-searchform').addClass('c-searchform--fixed');
			} else if (
				$('.c-searchform--fake').length > 0 &&
				$(window).scrollTop() < scrolloffset
			) {
				$('.c-searchform--fake').remove();
				$('.c-searchform').removeClass('c-searchform--fixed');
			}
		}
	}

	function setLoaded() {
		loaded = true;
		if ($('.c-searchform').length > 0) {
			scrolloffset = $('.c-searchform').offset().top - 15;
		}
	}

	function setBanner() {
		var searchContainer = $('.c-home-search');
		if ($(window).width() > searchContainer.outerWidth()) {
			var offset =
				($(window).width() - $('[role="main"]').outerWidth() + 30) / 2;
			searchContainer.css({
				'margin-left': '-' + offset + 'px',
				'margin-right': '-' + offset + 'px'
			});
		} else {
			searchContainer.css({
				'margin-left': '0px',
				'margin-right': '0px'
			});
		}
	}

	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this,
				args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	}

	$(document).on('ready', init);
	$(window).on('load', setLoaded);
	$(window).on(
		'resize',
		debounce(function() {
			setBanner();
		}, 300)
	);
	$(window).on('scroll', scrollSearch);
})(jQuery);

var algoliasearch = (function($) {
	//local client
	//var client = algoliasearch('22KAGMRS8M', 'f082f0c3a37605e8a6c626cd3903decc');
	//live client
	var client = algoliasearch(
		'YQUB5XXGHN',
		'5da58e8f4482b9870f6269d4ee6c3e58'
	);
	var index = client.initIndex('discourse');
	var searchContainer = jQuery('[data-community] ul');

	//get both search params
	var input = searchContainer.text();
	var excludeSearchQuery = '';
	var initialSearchQuery = searchContainer.find('li').map(function() {
		return $(this)
			.text()
			.trim();
	});
	excludeSearchQuery = initialSearchQuery
		.filter((index, item) => {
			return item.indexOf('not:') > -1;
		})
		.map((index, item) => {
			return item.replace('not:', 'NOT objectID:');
		});
	initialSearchQuery = initialSearchQuery.filter((index, item) => {
		return item.indexOf('not:') == -1;
	});

	excludeSearchQuery = excludeSearchQuery.get().join(' AND ');
	initialSearchQuery = initialSearchQuery.get().join(', ');
	//perform search using algolia api
	var performSearch = input_to_match => {
		index.search(
			input_to_match,
			{
				filters: excludeSearchQuery,
				attributesToRetrieve: ['title', 'objectID'],
				hitsPerPage: 5
			},
			(err, content) => {
				getResults(content);
			}
		);
	};

	//get all results from algolia, empty our searchresults container, loop through algolia results
	var getResults = content => {
		const hits = content['hits'];
		searchContainer.html('');
		if (hits.length == 0) {
			searchContainer.remove();
		} else {
			for (let hit of hits) {
				showResult(hit);
			}
		}
	};

	//create a searchresult snippet and add to our searchresults container
	var showResult = hit => {
		var title = hit._highlightResult.algolia_title.value;

		//Hide :pencil2: from related article titles: https://fairphone.atlassian.net/browse/WW-1018
		title = title.replace(':pencil2:', '');

		var permalink = 'https://forum.fairphone.com/t/' + hit.objectID;
		searchContainer.append(
			`<li><a href="${permalink}" target="_blank">${title}</a></li>`
		);
	};

	//when we're on searchresults & user enetered query is not empty perform a search
	$(window).on('load', function() {
		if (searchContainer.length > 0) {
			performSearch(initialSearchQuery);
		}
	});
})(jQuery);
