
require([
    "esri/Map",
    "esri/layers/FeatureLayer",
    "esri/views/MapView",
    "esri/core/promiseUtils",
    "esri/widgets/Legend",
    "esri/widgets/Home",
    "esri/widgets/Slider",
    "esri/widgets/Fullscreen",
    "esri/layers/GeoJSONLayer"
], function(Map, FeatureLayer, MapView, promiseUtils, Legend, Home, Slider, Fullscreen, GeoJSONLayer) {
//--------------------------------------------------------------------------
//
//  Setup Map and View
//
//--------------------------------------------------------------------------

//  For use data locally
//     const layer = new GeoJSONLayer({
//         url: "data/Barnesley_LCLU_CO2_details.geojson"
//     })

    const layer = new FeatureLayer({
        url: "https://services3.arcgis.com/ng8DEz82TbsYgB9h/arcgis/rest/services/CO2_levels_between_2015_to_2021_corrected_with_Barnesley/FeatureServer/0"
    });

    const map = new Map({
        basemap: {
            portalItem: {
                id: "4f2e99ba65e34bb8af49733d9778fb8e"
            }
        },
        layers: [layer]
    });

    const view = new MapView({
        map: map,
        container: "viewDiv",
        center: [-1.531900,53.563267],
        zoom: 5,
        constraints: {
            snapToZoom: false,
            minScale: 200000,
            maxScale: 4500
        },
        resizeAlign: "top-left"
    });

//--------------------------------------------------------------------------
//
//  Setup UI
//
//--------------------------------------------------------------------------

    const applicationDiv = document.getElementById("applicationDiv");
    const titleDiv = document.getElementById("titleDiv");

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
view.whenLayerView(layer).then(setupHoverTooltip);


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
        layer.renderer = createRenderer(concentrationField);
    }

    setField(72);

    /**
     * Returns a renderer with a color visual variable driven by the input
     */
    function createRenderer(field, year = 1984) {
        const opacityStops = [
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
        let highlight;

        const tooltip = createTooltip();

        const hitTest = promiseUtils.debounce(function (event) {

            return view.hitTest(event)
                .then(function (hit) {
                    const results = hit.results.filter(function (result) {
                        return result.graphic.layer === layer;
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
        const tooltip = document.createElement("div");
        let style = tooltip.style;

        tooltip.setAttribute("role", "tooltip");
        tooltip.classList.add("tooltip");

        const textElement = document.createElement("div");
        textElement.classList.add("esri-widget");
        tooltip.appendChild(textElement);

        view.container.appendChild(tooltip);

        let x = 0;
        let y = 0;
        let targetX = 0;
        let targetY = 0;
        let visible = false;

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
