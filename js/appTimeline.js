const load = function () {
    return new Promise()
}
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
        // This ensures that when going fullscreen
        // The top left corner of the view extent
        // stays aligned with the top left corner
        // of the view's container
        resizeAlign: "top-left"
    });

//--------------------------------------------------------------------------
//
//  Setup UI
//
//--------------------------------------------------------------------------

    const applicationDiv = document.getElementById("applicationDiv");
    const playButton = document.getElementById("playButton");
    const titleDiv = document.getElementById("titleDiv");
    let animation = null;

    const sliderMouth = document.getElementById('sliderMonth');
    const sliderYear = document.getElementById('sliderYear');

    const slider = new Slider({
        container: "slider",
        min: 0,
        max: 72,
        values: [ 0 ],
        step: 1,
        visibleElements: {
            rangeLabels: true
        }
    });

    // When user drags the slider:
    //  - stops the animation
    //  - set the visualized year to the slider one.
    slider.on("thumb-drag", function (event) {
        stopAnimation();
        setField(Math.round(event.value))
    });

    // Toggle animation on/off when user
    // clicks on the play button
    playButton.addEventListener("click", function() {
        if (playButton.classList.contains("toggled")) {
            stopAnimation();
        } else {
            startAnimation();
        }
    });

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

//--------------------------------------------------------------------------
//
//  Methods
//
//--------------------------------------------------------------------------
    const monthsField = [
    '2015-05',
    '2015-06',
    '2015-07',
    '2015-08',
    '2015-09',
    '2015-10',
    '2015-11',
    '2015-12',
    '2015-01',
    '2015-02',
    '2015-03',
    '2015-04',
    '2016-05',
    '2016-06',
    '2016-07',
    '2016-08',
    '2016-09',
    '2016-10',
    '2016-11',
    '2016-12',
    '2016-01',
    '2016-02',
    '2016-03',
    '2016-04',
    '2017-05',
    '2017-06',
    '2017-07',
    '2017-08',
    '2017-09',
    '2017-10',
    '2017-11',
    '2017-12',
    '2017-01',
    '2017-02',
    '2017-03',
    '2017-04',
    '2018-05',
    '2018-06',
    '2018-07',
    '2018-08',
    '2018-09',
    '2018-10',
    '2018-11',
    '2018-12',
    '2018-01',
    '2018-02',
    '2018-03',
    '2018-04',
    '2019-05',
    '2019-06',
    '2019-07',
    '2019-08',
    '2019-09',
    '2019-10',
    '2019-11',
    '2019-12',
    '2019-01',
    '2019-02',
    '2019-03',
    '2019-04',
    '2020-05',
    '2020-06',
    '2020-07',
    '2020-08',
    '2020-09',
    '2020-10',
    '2020-11',
    '2020-12',
    '2020-01',
    '2020-02',
    '2020-03',
    '2020-04',
    '2021-05',
    '2021-06',
    '2021-07',
    '2021-08',
    '2021-09',
    '2021-10'
];

    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ]

    function setField(value) {
        let concentrationField;
        if (value < 10) {
            concentrationField = 'Barnsley0' + value
        } else {
            concentrationField = 'Barnsley' + value;
        }

        const field = monthsField[value].split('-')
        const month = months[parseInt(field[1]) - 1];
        const year = field[0];

        sliderMouth.innerText = month;
        sliderYear.innerText = year;

        slider.viewModel.setValue(0, value);
        layer.renderer = createRenderer(concentrationField);
    }

    setField(0);

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
     * Starts the animation that cycle
     * through the construction years.
     */
    function startAnimation() {
        stopAnimation();
        animation = animate(slider.values[0]);
        playButton.classList.add("toggled");
    }

    /**
     * Stops the animations
     */
    function stopAnimation() {
        if (!animation) {
            return;
        }

        animation.remove();
        animation = null;
        playButton.classList.remove("toggled");
    }

    /**
     * Animates the color visual variable continously
     */
    function animate(startValue) {
        let animating = true;
        let value = startValue;
        const frame = function() {
            if (!animating) {
                return;
            }
            value += 1;
            if (value > 72) {
                value = 0;
            }
            setField(value)

            setTimeout(function () {
                requestAnimationFrame(frame);
            }, 500 );
        };

        frame();

        return {
            remove: function () {
                animating = false;
            }
        };
    }
});
