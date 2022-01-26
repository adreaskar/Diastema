var diagram = [];
var linesArray = [];

var $operatorProperties = $('#operator_properties');
var $deletebutton = $("#delete_node");
$operatorProperties.hide();
$deletebutton.hide();

// Send notification when receiving message from orchestrator //
const socket = io.connect();

toastr.options = {
	"closeButton": true,
	"debug": false,
	"newestOnTop": true,
	"progressBar": true,
	"positionClass": "toast-bottom-right",
	"preventDuplicates": false,
	"showDuration": "300",
	"hideDuration": "1000",
	"timeOut": "3000",
	"extendedTimeOut": "1500",
	"showEasing": "swing",
	"hideEasing": "linear",
	"showMethod": "fadeIn",
	"hideMethod": "fadeOut"
}
	
socket.on('Modeller', (update) => {
	toastr.info(update, "Notification:");
})
// --------------------------------------------------------- //


$(document).ready(function() {

	var canvas = $(".canvas");

	$(".draggable_operator").draggable({
		helper: "clone",
		scroll: false
	});

	// actions when dropped
	canvas.droppable({
		drop:function (event,ui) {
			if (ui.helper[0].children[1] === undefined) {
				return;
			}
			var node = {
				_id: (new Date).getTime(),
				position: ui.helper.position(),
				property:ui.helper[0].children[1].innerHTML
			};
			if(node.property == "Classification" || node.property == "Regression" || node.property == "Cleaning") {
				node.field = ''
				if(node.property == "Classification" || node.property == "Regression") {
					node.property = "Select Algorithm"
				}
			}
			
			// node.position.top +=220;
			node.position.top +=125;

			// get tool name
			node.type = ui.helper[0].children[1].innerHTML;

			diagram.push(node);
			renderDiagram(diagram);
		}
	});

	window.renderDiagram = function (diagram) {
		canvas.empty();
		for (var d in diagram) {
			var node = diagram[d];
			var html = "";

			switch (node.type) {
				case "Data Load":
					html = dataload;
					break;
				case "Visualize":
					html = visualize;
					break;
				case "Classification":
					html = classification1 + '<option selected="true" disabled="disabled" value="default">'+node.property+'</option>' + classification2 + '<input type="text" name="field" class="form-control column" style="margin:auto auto 15px auto;width:80%;height:70%" onclick="editColumn(this)" value="'+node.field+'"></input>' +  + classification3;
					break;
				case "Regression":
					html = regression1 + '<option selected="true" disabled="disabled" value="default">'+node.property+'</option>' + regression2 + '<input type="text" name="field" class="form-control column" style="margin:auto auto 15px auto;width:80%;height:70%" onclick="editColumn(this)" value="'+node.field+'"></input>' +  + regression3;
					break;
				case "Cleaning":
					html = cleaning1 + '<input type="number" step="0.01" min="0" max="1" name="field" class="form-control column" style="margin:auto auto 15px auto;width:80%;height:70%" onclick="editColumn(this)" value="'+node.field+'"></input>' +  + cleaning2;
					break;
				default:
					break;
			}

			var dom = $(html).css({
				"position":"absolute",
				"top": node.position.top,
				"left": node.position.left
			}).draggable({
				containment: '.canvas',
				stop:function (event,ui){
					var id = ui.helper.attr("id");
					for (var i in diagram) {
						if (diagram[i]._id == id) {
							diagram[i].position.top = ui.position.top;
							diagram[i].position.left = ui.position.left;
						}
					}
					for (k in linesArray) {
						linesArray[k].position();
					}
				},
				drag: function(event,ui) {
					for (k in linesArray) {
						linesArray[k].position();
					}
				}
			}).attr("id",node._id);
			canvas.append(dom);
		}

		reDraw();
		
	}

	// Generate data
	var data;
	function generateData() {

		const d = new Date();

		// Main json file template ---------------------------------------
		data = {
			"diastema-token":"diastema-key",
			"analysis-id": $("#analysisid").val(),
			"database-id": $("#org").val(),
			"jobs":[],
			"metadata":{
				"analysis-label": $("#label").val(),
				"usecase": $("#usecase").val(),
				"source": $("#source").val(),
				"dataset": $("#dataset").val(),
				"user": $("#user").val(),
				"analysis-date": ('0'+d.getDate()).slice(-2) + "-" + ('0'+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear(), 
				"analysis-time": ('0'+d.getHours()).slice(-2) + ":" + ('0'+d.getMinutes()).slice(-2) + ":" + ('0'+d.getSeconds()).slice(-2) + ":" + d.getMilliseconds()
			},
			"nodes":[],
			"connections":[]
		};

		// Get nodes -------------------
		for (l in diagram) {
			data.nodes.push(diagram[l]);
		}
		// Get connections ----------------------
		for (k in linesArray) {
			data.connections.push(linesArray[k]);
		}
		// Create jobs array --
		for (m in data.nodes) {

			// Job template
			let job = {
				"title":data.nodes[m].type.replace(/\s+/g, '-').toLowerCase(),
				"id":data.nodes[m]._id,
				"step":parseInt(m)+1,
				"from":'',
				"next":[],
				"save":false
			};

			// Calculate the next / from properties of every node
			// by looping through all existing connections and 
			// comparing node id's.
			if (job.step === 1 || data.nodes[m].type === "Data Load") job.from = 0;
			let countNotLast = 0
			for (n in data.connections) {
				if (data.connections[n].to === job.id) {
					for (l in data.jobs) {
						if (data.jobs[l].id === data.connections[n].from) {
							data.jobs[l].next.push(job.step);
							job.from = data.jobs[l].step;
							countNotLast +=1 ;
						}
					}
				}
			}

			// Properties specific to the Data Load job
			if (data.nodes[m].type === "Data Load") {
				job.files = [];
				const path = $("#org").val() + "/analysis-" + $("#analysisid").val() + "/raw";
				job.files.push(path);
				job["dataset-name"] = $("#dataset").val();
			}

			// Properties specific to the Classification and Regression jobs
			if (data.nodes[m].type === "Classification" || data.nodes[m].type === "Regression") {
				job.algorithm = data.nodes[m].property.toLowerCase();
				if (job.algorithm === "select algorithm") job.algorithm = false;
				job.column = data.nodes[m].field;
			}

			// Properties specific to the Cleaning job
			if (data.nodes[m].type == "Cleaning") {
				if (data.nodes[m].field === "") {
					job["max-shrink"] = false;
				} else {
					job["max-shrink"] = parseFloat(data.nodes[m].field);
				}
			}

			data.jobs.push(job);
		}

		// Calculate the next property of the last node
		for (m in data.jobs) {
			if (data.jobs[m].next.length === 0) data.jobs[m].next.push(0);
		}

		// Determine if auto modelling is enabled or not
		if ($("#checkbox").is(':checked')) {
			data.automodel = true;
		} else {
			data.automodel = false;
		}
	}

	// Load data
	$('#load_data').click(()=>{
		
		let data = $("#flowchart_data").val();

		try {
			data = jQuery.parseJSON(data);

			// Make nodes ---------------
			for (i in data.nodes) {
				let node = data.nodes[i];
				diagram.push(node);
			}
			renderDiagram(diagram);

			// Make lines ----------------------------------------------------------------------
			for (o in data.connections) {
				let line = data.connections[o];

				let fromChildren = $('#'+line.from).find(".flowchart-operator-connector-arrow");
				let toChildren = $('#'+line.to).find(".flowchart-operator-connector-arrow");

				let newLine = new LeaderLine(
					LeaderLine.pointAnchor(fromChildren[0]),
					LeaderLine.pointAnchor(toChildren[0]),
					{
						startPlug: 'disc',
						endPlug: 'disc',
						startPlugColor: '#3a91b3',
						endPlugColor:'#3a91b3',
						startPlugSize: 0.7,
						endPlugSize: 0.7,
						color:'#3a91b3',
						startSocket:'right',
						endSocket:'left',
						size: 5
					}
				);
		
				newLine["from"] = line.from;
				newLine["to"] = line.to;
		
				linesArray.push(newLine);
			}

			// Tick automodel if needed -------------
			if (data.automodel === true) {
				$("#checkbox").prop("checked", true);
			}

			$('#diagrambtn').removeClass("active");
			$("#diagram").collapse('toggle');
			renderDiagram(diagram);
		} catch (e) {
			alert('Please insert valid JSON format.')
			return false;
		}
	});

	// Send data
	$('#send_data').click(()=>{
		if (validateFields()) {
			generateData();
			// $.ajax({
			// 	type: 'POST',
			// 	data: data,
			// 	success: function() {},
			// 	error: function(jqXHR, textStatus, err){ alert('text status: '+textStatus+', error: '+err) },
			// 	url: 'http://localhost:3000/orchestrator',
			// 	cache:false
			// });

			const socket2 = io("localhost://10.20.20.85:5000");
			socket2.emit("analysis", {'analysis':data});
			socket2.disconnect();

		} else {
			toastr.error("Please fill all the fields requied.", "Notification:");
		}
	});

	// Download data
	$('#set_data').click(()=>{
		if (validateFields()) {
			generateData();
			download(JSON.stringify(data, null, 2), "data.json", "text/plain");
		} else {
			toastr.error("Please fill all the fields requied.", "Notification:");
		}
	});

	// Go to dashboard button
	$('#dashb').click(()=> {
		let url = window.location.origin;
		window.location.replace(url+"/dashboard");
	});
});

var count = 0;
var start_id = 0
var end_id = 0;
var dots = [];
var tobedeleted = [];
var linepos = [];

function download(content, fileName, contentType) {
	const a = document.createElement("a");
	const file = new Blob([content], { type: contentType });
	a.href = URL.createObjectURL(file);
	a.download = fileName;
	a.click();
}

function getParams(params) {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const code = urlParams.get(params);
	return code;
}

function drawLine(item) {
	
	count++;
	
	// Set up a parent array
	var parents = [];
	// Push each parent element to the array
	for ( ; item && item !== document; item = item.parentNode ) {
		parents.push(item);
	}

	let id = parents[6].id
	let dot = parents[0];
	console.log(id);

	// Set start node
	if (count == 1) {
		dots.push(dot);
		for (o in diagram) {
			if (diagram[o]._id == id) {
				// start = document.getElementById(diagram[o]._id);
				start_id = diagram[o]._id;
			}
		}
	// Set end node
	} else if (count == 2) {
		dots.push(dot);
		for (o in diagram) {
			if (diagram[o]._id == id) {
				// end = document.getElementById(diagram[o]._id);
				end_id = diagram[o]._id;
			}
		}

		if (dots[1] === dots[0]) {
			count = 1;
			return;
		}

		var line = new LeaderLine(
			LeaderLine.pointAnchor(dots[0]),
			LeaderLine.pointAnchor(dots[1]),
			{
				startPlug: 'disc',
				endPlug: 'disc',
				startPlugColor: '#3a91b3',
				endPlugColor:'#3a91b3',
				startPlugSize: 0.7,
				endPlugSize: 0.7,
				color:'#3a91b3',
				startSocket:'right',
				endSocket:'left',
				size: 5
			}
		);

		line["from"] = start_id;
		line["to"] = end_id;

		linesArray.push(line);
		dots = [];

		count = 0;
	}
}

function editNode(element) {
	// Set up a parent array
	let parents = [];
	// Push each parent element to the array
	for ( ; element && element !== document; element = element.parentNode ) {
		parents.push(element);
	}
	let elemid = parents[0].id;
	let title = parents[0];
	for (s in diagram) {
		if (diagram[s]._id == elemid) {
			var pos = s;
		}
	}

	// Click on title to show edit box
	try {
		$('#'+elemid).click(function(event){
			event.stopPropagation();
			// $operatorProperties.show();
			$deletebutton.show();
			$('#operator_title').val($(title).text());
		});
	} catch(err) {
		
	}
	
	// Change property of node object
	window.changeProperty = function (node) {
		if (node.value == "Cleaning") {
			// Set up a parent array
			let parents = [];
			let element = node;
			// Push each parent element to the array
			for ( ; element && element !== document; element = element.parentNode ) {
				parents.push(element);
			}
			$("#"+parents[3].id+" label").hide();
			$("#"+parents[3].id+" input").hide();
		}
		diagram[pos].property = node.value;
	}
	// Click button to delete node and re-render diagram
	window.deleteNode = function () {
		for (j in linesArray) {
			if (linesArray[j].from == elemid || linesArray[j].to == elemid) {
				tobedeleted.push(linesArray[j]);
				linepos.push(parseInt(j));
			}
		}
		for (g in tobedeleted) {
			for (f in linesArray) {
				if (tobedeleted[g]._id == linesArray[f]._id) {
					linesArray.splice(f,1);
				}
			}
			tobedeleted[g].remove();
		}
		tobedeleted = [];
		linepos = [];

		diagram.splice(pos,1);
		renderDiagram(diagram);
	};
}

function editColumn(element) {
	// Set up a parent array
	let parents = [];

	// Push each parent element to the array
	for ( ; element && element !== document; element = element.parentNode ) {
		parents.push(element);
	}
	let elemid = parents[2].id;

	// Click field to add column property to node object
	$('#'+elemid+'  input[name="field"]').keyup(function(){
		for (s in diagram) {
			if (diagram[s]._id == elemid) {
				diagram[s].field = $(this).val();
				// Cleaning service max shrink validation check ---------------------------- //
				if (diagram[s].property === "Cleaning") {
					if ($(this).val() < 0 || $(this).val()> 1) {
						toastr.error("Please enter a value between 0 and 1.", "Notification:");
						$(this).val("")
					}
				}
				// ------------------------------------------------------------------------ //
			}
		}
	});
}

function reDraw() {
	for (var d in diagram) {
			
		// Redraw each connected line
		let templines = [];
		for (k in linesArray) {
			
			let fromid = linesArray[k].from;
			let toid = linesArray[k].to;

			let elemfrom = document.getElementById(fromid);
			let elemto = document.getElementById(toid);

			let fromchildren = $(elemfrom).find('*');
			let tochildren = $(elemto).find('*');

			if (fromchildren[0].classList.contains("flowchart-operator-data-load")) {
				var nodefrom = fromchildren[8];
			}
			if (fromchildren[0].classList.contains("flowchart-operator-tool")) {
				var nodefrom = fromchildren[13];
			}

			if (tochildren[0].classList.contains("flowchart-operator-tool")) {
				var nodeto = tochildren[7];
			}
			if (tochildren[0].classList.contains("flowchart-operator-vis")) {
				var nodeto = tochildren[7];
			}

			linesArray[k].remove();
			linesArray.splice(k,1);

			var line = new LeaderLine(
				LeaderLine.pointAnchor(nodefrom),
				LeaderLine.pointAnchor(nodeto),
				{
					startPlug: 'disc',
					endPlug: 'disc',
					startPlugColor: '#3a91b3',
					endPlugColor:'#3a91b3',
					startPlugSize: 0.7,
					endPlugSize: 0.7,
					color:'#3a91b3',
					startSocket:'right',
					endSocket:'left',
					size: 5
				}
			);

			line["from"] = fromid;
			line["to"] = toid;

			templines.push(line);
		}
		linesArray = linesArray.concat(templines);
	}
}

function minimize() {
	$("#delete_node").toggleClass('resizeDel');
	$("#delete_node").html((i, text)=>{
		return text === "Delete selected" ? "<i class='fas fa-trash-alt' style='font-size:15px'margin-left:-10px></i>" : "Delete selected";
	});
}

function validateFields() {
	let outcome = true;
	for (m in diagram) {
		if (diagram[m].type === "Classification" || diagram[m].type === "Regression") {
			if (diagram[m].field === "") {
				outcome = false;
			};
		}
	}
	return outcome;
}

// Click anywhere to hide node delete btn
$('html').click(function() {
	$deletebutton.hide();
	tobedeleted = [];

	console.log(diagram);
	console.log(linesArray);
});