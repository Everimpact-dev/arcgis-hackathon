
require([
    "esri/Map",
    "esri/views/MapView",
    "esri/core/promiseUtils",
    "esri/widgets/Legend",
    "esri/widgets/Home",
    "esri/widgets/Slider",
    "esri/widgets/Fullscreen",
    "esri/layers/GeoJSONLayer"
], function(Map, MapView, promiseUtils, Legend, Home, Slider, Fullscreen, GeoJSONLayer) {
//--------------------------------------------------------------------------
//
//  Setup Map and View
//
//--------------------------------------------------------------------------
    const geoJSONLayer = new GeoJSONLayer({
        url: "data/Barnesley_LCLU_CO2_details.geojson"
    })

    var map = new Map({
        basemap: {
            portalItem: {
                id: "4f2e99ba65e34bb8af49733d9778fb8e"
            }
        },
        layers: [geoJSONLayer]
    });

    var view = new MapView({
        map: map,
        container: "viewDiv",
        center: [-1.531900,53.563267],
        zoom: 5,
        constraints: {
            snapToZoom: false,
            //minScale: 72223.819286,
            minScale: 200000,
            // maxScale: 4500
        },
        resizeAlign: "top-left"
    });

//--------------------------------------------------------------------------
//
//  Setup UI
//
//--------------------------------------------------------------------------

    var applicationDiv = document.getElementById("applicationDiv");
    var titleDiv = document.getElementById("titleDiv");

    view.ui.empty("top-left");
    view.ui.add(titleDiv, "top-left");
    view.ui.add(
        new Home({
            view: view
        }),
        "top-left"
    );
    view.ui.add(
        new Legend({
            view: view
        }),
        "bottom-left"
    );
    view.ui.add(
        new Fullscreen({
            view: view,
            element: applicationDiv
        }),
        "top-right"
    );

// When the layerview is available, setup hovering interactivity
view.whenLayerView(geoJSONLayer).then(setupHoverTooltip);


//--------------------------------------------------------------------------
//
//  Methods
//
//--------------------------------------------------------------------------

    function setField(value) {
        let concentrationField;
        if (value < 10) {
            concentrationField = 'Barnsley0' + value
        } else {
            concentrationField = 'Barnsley' + value;
        }
        geoJSONLayer.renderer = createRenderer(concentrationField);
    }

    setField(72);

    /**
     * Returns a renderer with a color visual variable driven by the input
     * year. The selected year will always render buildings built in that year
     * with a light blue color. Buildings built 20+ years before the indicated
     * year are visualized with a pink color. Buildings built within that
     * 20-year time frame are assigned a color interpolated between blue and pink.
     */
    function createRenderer(field, year = 1984) {
        var opacityStops = [
            {
                opacity: 1,
                value: year
            },
            {
                opacity: 0,
                value: year + 1
            }
        ];
        return {
            type: "simple",
            symbol: {
                type: "simple-fill",
                color: "rgb(0, 0, 0)",
                outline: null
            },
            visualVariables: [
                {
                    type: "opacity",
                    field: field,
                    stops: opacityStops,
                    legendOptions: {
                        showLegend: false
                    }
                },
                {
                    type: "color",
                    field: field,
                    legendOptions: {
                        title: "CO₂ concentration:"
                    },
                    stops: [
                        {
                            value: 440,
                            color: "#d7191c",
                            label: "425 - 440 ppm"
                        },
                        {
                            value: 425,
                            color: "#f07c4a",
                            label: "420 - 425 ppm"
                        },
                        {
                            value: 420,
                            color: "#fec980",
                            label: "415 - 420 ppm"
                        },
                        {
                            value: 415,
                            color: "#ffffbf",
                            label: "410 - 415 ppm"
                        },
                        {
                            value: 410,
                            color: "#c7e8ad",
                            label: "405 - 410 ppm"
                        },
                        {
                            value: 405,
                            color: "#80bfab",
                            label: "400 - 405 ppm"
                        },
                        {
                            value: 400,
                            color: "#2b83ba",
                            label: "less than 400 ppm"
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Sets up a moving tooltip that displays
     * the construction year of the hovered building.
     */
    function setupHoverTooltip(layerview) {
        var highlight;

        var tooltip = createTooltip();

        var hitTest = promiseUtils.debounce(function (event) {

            return view.hitTest(event)
                .then(function (hit) {
                    var results = hit.results.filter(function (result) {
                        return result.graphic.layer === geoJSONLayer;
                    });

                    if (!results.length) {
                        return null;
                    }
                    return {
                        graphic: results[0].graphic,
                        screenPoint: hit.screenPoint
                    };
                });
        });

        view.on("pointer-move", function(event) {
            return hitTest(event)
                .then(function (hit) {
                    // remove current highlighted feature
                    if (highlight) {
                        highlight.remove();
                        highlight = null;
                    }

                    // highlight the hovered feature
                    // or hide the tooltip
                    if (hit) {
                        var graphic = hit.graphic;
                        var screenPoint = hit.screenPoint;

                        highlight = layerview.highlight(graphic);
                        tooltip.show(screenPoint, "Concentration " + (Math.round(graphic.getAttribute("Barnsley72") * 1000) / 1000) + " ppm");
                    } else {
                        tooltip.hide();
                    }
                }, function () {
                });
        });
    }

    /**
     * Creates a tooltip to display a the construction year of a building.
     */
    function createTooltip() {
        var tooltip = document.createElement("div");
        var style = tooltip.style;

        tooltip.setAttribute("role", "tooltip");
        tooltip.classList.add("tooltip");

        var textElement = document.createElement("div");
        textElement.classList.add("esri-widget");
        tooltip.appendChild(textElement);

        view.container.appendChild(tooltip);

        var x = 0;
        var y = 0;
        var targetX = 0;
        var targetY = 0;
        var visible = false;

        // move the tooltip progressively
        function move() {
            x += (targetX - x) * 0.1;
            y += (targetY - y) * 0.1;

            if (Math.abs(targetX - x) < 1 && Math.abs(targetY - y) < 1) {
                x = targetX;
                y = targetY;
            } else {
                requestAnimationFrame(move);
            }
            style.transform = "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px, 0)";
        }

        return {
            show: function (point, text) {
                if (!visible) {
                    x = point.x;
                    y = point.y;
                }

                targetX = point.x;
                targetY = point.y;
                style.opacity = 1;
                visible = true;
                textElement.innerHTML = text;


                move();
            },
            hide: function () {
                style.opacity = 0;
                visible = false;
            }
        };
    }
});
