const d3 = require("d3");
const Tabletop = require("tabletop");
const _ = {
  map: require("lodash/map"),
  uniqBy: require("lodash/uniqBy"),
  capitalize: require("lodash/capitalize"),
  each: require("lodash/each")
};

const InputSanitizer = require("./inputSanitizer");
const Radar = require("../models/radar");
const Quadrant = require("../models/quadrant");
const Ring = require("../models/ring");
const Blip = require("../models/blip");
const GraphingRadar = require("../graphing/radar");
const MalformedDataError = require("../exceptions/malformedDataError");
const SheetNotFoundError = require("../exceptions/sheetNotFoundError");
const ExceptionMessages = require("./exceptionMessages");

const radarDefinition = require("json!yaml!../radar/radar.yml");


function createRadar() {
    try {
        let blips = _.map(radarDefinition, new InputSanitizer().sanitize);

        document.title = "Technology Radar";

        let rings = _.map(_.uniqBy(blips, "ring"), "ring");
        let ringMap = {};
        let maxRings = 4;

        _.each(rings, function(ringName, i) {
            if (i == maxRings) {
                throw new MalformedDataError(ExceptionMessages.TOO_MANY_RINGS);
            }
            ringMap[ringName] = new Ring(ringName, i);
        });

        let quadrants = {};
        _.each(blips, function(blip) {
            if (!quadrants[blip.quadrant]) {
                quadrants[blip.quadrant] = new Quadrant(_.capitalize(blip.quadrant));
            }
            quadrants[blip.quadrant].add(
                new Blip(
                    blip.name,
                    ringMap[blip.ring],
                    blip.isNew.toLowerCase() === "true",
                    blip.topic,
                    blip.description
                )
            );
        });

        let radar = new Radar();
        _.each(quadrants, function(quadrant) {
            radar.addQuadrant(quadrant);
        });

        let size = window.innerHeight - 133 < 620
            ? 620
            : window.innerHeight - 133;

        new GraphingRadar(size, radar).init().plot();
    } catch (exception) {
        displayErrorMessage(exception);
    }
}


function displayErrorMessage(exception) {
    d3.selectAll(".loading").remove();
    let message =
        "Oops! It seems like there are some problems with loading your data. ";

    if (exception instanceof MalformedDataError) {
        message = message.concat(exception.message);
    } else if (exception instanceof SheetNotFoundError) {
        message = exception.message;
    } else {
        console.error(exception);
    }

    message = message.concat(
        "<br/>",
        'Please check <a href="https://info.thoughtworks.com/visualize-your-tech-strategy-guide.html#faq">FAQs</a> for possible solutions.'
    );

    d3
        .select("body")
        .append("div")
        .attr("class", "error-container")
        .append("div")
        .attr("class", "error-container__message")
        .append("p")
        .html(message);
}

module.exports = createRadar;
