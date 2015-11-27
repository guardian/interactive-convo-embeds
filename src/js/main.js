import doT from 'olado/doT'
import thatTemplate from '../templates/that.html!text'
import betweenTemplate from '../templates/between.html!text'
import bean from 'fat/bean'
import bowser from 'ded/bowser'
import bonzo from 'ded/bonzo'
import reqwest from 'reqwest'
import {fetchJSON} from './lib/fetch'
import iframeMessenger from 'guardian/iframe-messenger';

let jsonURL = 'https://interactive.guim.co.uk/docsdata-test/1O84T2QVZ5CUWELQ4_ZfdfctxuTTP2JE0xropElb7DAo.json'

export function between(el, context) {
    init(el, context, 'article', doT.template(betweenTemplate))
}

export function that(el, context) {
    init(el, context, 'interactive', doT.template(thatTemplate))
}

export function init(el, context, contentKey, templateFn) {
    fetchJSON(jsonURL).then(spreadsheet => {
        var contents = spreadsheet.sheets[contentKey];

        let match = /[?&]on=(\w+)/.exec(document.location.search);
        if (match) contents = contents.filter(c => c.url.slice(-5) !== match[1]);

        el.innerHTML = templateFn({
            contents: contents,
            meta: spreadsheet.sheets.meta[0]
        })

        var embedEl = el.querySelector('.embed');

        var firstTitleEl = el.querySelector('.title');
        var currentIndex = 0;

        function goToIndex(index) {
            currentIndex = index;
            firstTitleEl.style.marginLeft = `${currentIndex * -100}%`;
            embedEl.setAttribute('meta', currentIndex === 0 ? 'first' : currentIndex === contents.length-1 ? 'last' : '');
            embedEl.href = contents[currentIndex].url;
        }

        var goToNext = () => {
            var nextIndex = currentIndex === contents.length-1 ? 0 : currentIndex + 1;
            goToIndex(nextIndex);
        };

        var goToPrev = () => {
            var nextIndex = currentIndex === 0 ? contents.length-1 : currentIndex - 1;
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

        var $embedEl = bonzo(embedEl),
            prevEl = embedEl.querySelector('.prev'),
            nextEl = embedEl.querySelector('.next');

        prevEl.addEventListener('mouseenter', evt => $embedEl.addClass('embed--fast-transition'))
        prevEl.addEventListener('mouseleave', evt => $embedEl.removeClass('embed--fast-transition'))
        nextEl.addEventListener('mouseenter', evt => $embedEl.addClass('embed--fast-transition'))
        nextEl.addEventListener('mouseleave', evt => $embedEl.removeClass('embed--fast-transition'))

        prevEl.addEventListener('click', evt => {
            evt.preventDefault();
            if (currentIndex !== 0) {
                goToPrev();
                bonzo(embedEl).addClass('embed--fast-transition')
            }
        })


        nextEl.addEventListener('click', evt => {
            evt.preventDefault();
            if (currentIndex !== contents.length-1) {
                goToNext();
            }
        })

        var interval,
            startCarousel = () => interval = window.setInterval(goToNext, 5000),
            stopCarousel = () => window.clearInterval(interval);

        startCarousel();
        goToIndex(0);
        iframeMessenger.enableAutoResize();
    })
}
