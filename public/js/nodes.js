var dataload = 
'<div onclick="editNode(this)">' +
    '<div id="tool" class="flowchart-operator-data-load flowchart-default-operator draggable_operator" data-nb-inputs="0" data-nb-outputs="1">' +
        '<div class="flowchart-operator-title ui-draggable-handle" onclick="editNode(this)">Data Load</div>' + 
        '<div class="flowchart-operator-inputs-outputs">' +
            '<div class="flowchart-operator-inputs"></div>' +
            '<div class="flowchart-operator-outputs">' +
                '<div class="flowchart-operator-connector-set">' +
                    '<div class="flowchart-operator-connector">' +
                        '<div class="flowchart-operator-connector-label">' +
                            'Load' +
                        '</div>' +
                        '<div class="flowchart-operator-connector-arrow" onclick="drawLine(this)"></div>' +
                        '<div class="flowchart-operator-connector-small-arrow"></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>'
    '</div>' +
'</div>';

var visualize = 
'<div onclick="editNode(this)">' +
    '<div id="tool" class="flowchart-operator-vis flowchart-default-operator draggable_operator" data-nb-inputs="0" data-nb-outputs="1">' +
        '<div class="flowchart-operator-title ui-draggable-handle" onclick="editNode(this)">Visualize</div>' + 
        '<div class="flowchart-operator-inputs-outputs">' +
            '<div class="flowchart-operator-inputs">' +
                '<div class="flowchart-operator-connector-set">' +
                    '<div class="flowchart-operator-connector">' +
                        '<div class="flowchart-operator-connector-label">Load</div>' +
                        '<div class="flowchart-operator-connector-arrow" onclick="drawLine(this)"></div>' +
                        '<div class="flowchart-operator-connector-small-arrow"></div>' +
                    '</div>' +
                '</div>' +
            '</div>'
            '<div class="flowchart-operator-outputs"></div>' +
        '</div>' +
    '</div>' +
'</div>';

var classification1, regression1;
regression1 =
'<div onclick="editNode(this)">' +
    '<div id="tool" class="flowchart-operator-tool flowchart-default-operator draggable_operator" data-nb-inputs="0" data-nb-outputs="1">' +
        '<div class="flowchart-operator-title ui-draggable-handle"> Regression </div>' +
        '<div class="flowchart-operator-inputs-outputs">' +
            '<div class="flowchart-operator-inputs">' +
                '<div class="flowchart-operator-connector-set">' +
                    '<div class="flowchart-operator-connector">' +
                        '<div class="flowchart-operator-connector-label">Load</div>' +
                        '<div class="flowchart-operator-connector-arrow" onclick="drawLine(this)"></div>' +
                        '<div class="flowchart-operator-connector-small-arrow"></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flowchart-operator-outputs">' +
                '<div class="flowchart-operator-connector-set">' +
                    '<div class="flowchart-operator-connector">' +
                        '<div class="flowchart-operator-connector-label">Export</div>' +
                        '<div class="flowchart-operator-connector-arrow" onclick="drawLine(this)"></div>' +
                        '<div class="flowchart-operator-connector-small-arrow"></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' + 
        '<select name="nodeProperty" id="nodeProperty" onchange="changeProperty(this)" style="margin:5px auto 10px auto;">';
classification1 =
'<div onclick="editNode(this)">' +
    '<div id="tool" class="flowchart-operator-tool flowchart-default-operator draggable_operator" data-nb-inputs="0" data-nb-outputs="1">' +
        '<div class="flowchart-operator-title ui-draggable-handle"> Classification </div>' +
        '<div class="flowchart-operator-inputs-outputs">' +
            '<div class="flowchart-operator-inputs">' +
                '<div class="flowchart-operator-connector-set">' +
                    '<div class="flowchart-operator-connector">' +
                        '<div class="flowchart-operator-connector-label">Load</div>' +
                        '<div class="flowchart-operator-connector-arrow" onclick="drawLine(this)"></div>' +
                        '<div class="flowchart-operator-connector-small-arrow"></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flowchart-operator-outputs">' +
                '<div class="flowchart-operator-connector-set">' +
                    '<div class="flowchart-operator-connector">' +
                        '<div class="flowchart-operator-connector-label">Export</div>' +
                        '<div class="flowchart-operator-connector-arrow" onclick="drawLine(this)"></div>' +
                        '<div class="flowchart-operator-connector-small-arrow"></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' + 
        '<select name="nodeProperty" id="nodeProperty" onchange="changeProperty(this)" style="margin:5px auto 10px auto;">';
    var classification2 =
            '<option value="Logistic regression">Logistic regression</option>' +
            '<option value="Decision tree classifier">Decision tree classifier</option>' +
            '<option value="Random forest classifier">Random forest classifier</option>' +
            '<option value="Gradient-boosted tree classifier">Gradient-boosted tree classifier</option>' +
            '<option value="Multilayer perceptron classifier">Multilayer perceptron classifier</option>' +
            '<option value="Linear Support Vector Machine">Linear Support Vector Machine</option>' +
        '</select>' +
        '<label for="field" style="margin-bottom:-3px;">Use column:</label>';
    var regression2 =
            '<option value="Linear regression">Linear regression</option>' +
            '<option value="Generalized linear regression">Generalized linear regression</option>' +
            '<option value="Decision tree regression">Decision tree regression</option>' +
            '<option value="Random forest regression">Random forest regression</option>' +
            '<option value="Gradient-boosted tree regression">Gradient-boosted tree regression</option>' +
        '</select>' +
        '<label for="field" style="margin-bottom:-3px;">Use column:</label>';
    var classification3, regression3;
    classification3 = regression3 = 
    '</div>' +
'</div>';

var cleaning1 = 
'<div onclick="editNode(this)">' +
    '<div id="tool" class="flowchart-operator-tool flowchart-default-operator draggable_operator" data-nb-inputs="0" data-nb-outputs="1">' +
        '<div class="flowchart-operator-title ui-draggable-handle"> Cleaning </div>' +
        '<div class="flowchart-operator-inputs-outputs">' +
            '<div class="flowchart-operator-inputs">' +
                '<div class="flowchart-operator-connector-set">' +
                    '<div class="flowchart-operator-connector">' +
                        '<div class="flowchart-operator-connector-label">Load</div>' +
                        '<div class="flowchart-operator-connector-arrow" onclick="drawLine(this)"></div>' +
                        '<div class="flowchart-operator-connector-small-arrow"></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flowchart-operator-outputs">' +
                '<div class="flowchart-operator-connector-set">' +
                    '<div class="flowchart-operator-connector">' +
                        '<div class="flowchart-operator-connector-label">Export</div>' +
                        '<div class="flowchart-operator-connector-arrow" onclick="drawLine(this)"></div>' +
                        '<div class="flowchart-operator-connector-small-arrow"></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<label for="field" style="margin-bottom:-3px;">Max Shrink:</label>';
        var cleaning2 = 
    '</div>' +
'</div>';