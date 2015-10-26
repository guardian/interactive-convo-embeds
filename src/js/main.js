import doT from 'olado/doT'
import mainTemplate from '../templates/main.html!text'
import bean from 'fat/bean'
import bowser from 'ded/bowser'
import bonzo from 'ded/bonzo'
import reqwest from 'reqwest'

var renderMainTemplate = doT.template(mainTemplate);

export function init(el, context) {
	var protocol = (bowser.msie && bowser.version < 10 ? '//' : 'https://');
	reqwest({
        url: `${protocol}interactive.guim.co.uk/docsdata/1O84T2QVZ5CUWELQ4_ZfdfctxuTTP2JE0xropElb7DAo.json`,
        type: 'json', contentType: 'application/json', crossOrigin: true
    }).then(spreadsheet => {
    	var contents = spreadsheet.sheets.interactive;
		el.innerHTML = renderMainTemplate({
			contents: contents
		})

		var embedEl = el.querySelector('.embed');

		embedEl.setAttribute('meta', 'first')

		var firstTitleEl = el.querySelector('.title');
		var currentIndex = 0;

		function goToIndex(index) {
			currentIndex = index;
			firstTitleEl.style.marginLeft = `${currentIndex * -100}%`;
			embedEl.setAttribute('meta', currentIndex === 0 ? 'first' : currentIndex === contents.length-1 ? 'last' : '');
		}

		var goToNext = () => {
			var nextIndex = currentIndex === contents.length-1 ? 0 : currentIndex + 1;
			goToIndex(nextIndex);
		};

		embedEl.addEventListener('mouseenter', evt => {
			bonzo(embedEl).addClass('embed--hover');
			stopCarousel();
		})

		embedEl.addEventListener('mouseleave', evt => {
			bonzo(embedEl).removeClass('embed--hover');
			startCarousel();
		})

		var interval,
			startCarousel = () => interval = window.setInterval(goToNext, 5000),
			stopCarousel = () => window.clearInterval(interval);

		startCarousel();
    })
}