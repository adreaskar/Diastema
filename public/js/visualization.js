$(document).ready(function() {

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
    };
    toastr.info("Visualizing data", "Notification: ");

    const file = $("#newpath").val();//data.newpath;
    const column = $("#column").val();//data.column;

    // $('#dataset').text($("#file").val());
    // $('#org').text($("#organization").val().charAt(0).toUpperCase() + $("#organization").val().slice(1));

    // Load the file from its destination --
    d3.csv(file).then((loadedData) => {
        
        let labels = [];

        // Calculate the distinct values or labels --
        for (let i = 0; i < loadedData.length; i++) {

            if (!labels.includes(loadedData[i][column])) {
                labels.push(loadedData[i][column]);
            }
        }

        labels.sort();
        let data = new Array(labels.length).fill(0);

        // Calculate how many times each value appears in data set --
        for (let i = 0; i < loadedData.length; i++) {
            for (let j = 0; j < labels.length; j++) {
                if (loadedData[i][column] == labels[j]) {
                    data[j] = data[j] + 1;
                    break;
                }
            }
        }
        
        labels.map(String);
        labels = labels.map(i => column.charAt(0).toUpperCase() + column.slice(1) + " " + i);

        const bgColor = {
            id: 'bgColor',
            beforeDraw: (chart,steps,options) => {
                const {ctx, width, height} = chart;
                ctx.fillStyle = 'white';
                ctx.fillRect(0,0,width,height);
                ctx.restore();
            }
        }
        const options = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Wine Quality',
                    data:data,
                    backgroundColor: [
                        "rgba(255,159,64,0.7)",
                        "rgba(75,192,192,0.7)",
                        "rgba(255,99,132,0.7)",
                        "rgba(54,162,235,0.7)",
                        "rgba(255,255,0,0.7)",
                        "rgba(153,102,255,0.7)"
                    ]
                }]
            },
            options: {
                scales: {
                y: {
                    beginAtZero: true
                }
                }
            },
            plugins: [bgColor]
        };
        $('#plot1').text(options.type.charAt(0).toUpperCase() + options.type.slice(1) + " Chart");

        const options2 = {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data:data,
                    backgroundColor: [
                        "rgba(255,159,64,0.7)",
                        "rgba(75,192,192,0.7)",
                        "rgba(255,99,132,0.7)",
                        "rgba(54,162,235,0.7)",
                        "rgba(255,255,0,0.7)",
                        "rgba(153,102,255,0.7)"
                    ]
                }]
            },
            plugins: [bgColor]
        };
        $('#plot2').text(options2.type.charAt(0).toUpperCase() + options2.type.slice(1) + " Chart");

        var ctx = document.getElementById('mychart').getContext('2d');
        var ctx2 = document.getElementById('mychart2').getContext('2d');

        let chart = new Chart(ctx,options);
        let chart2 = new Chart(ctx2,options2);
    });
});

// Go to dashboard button
$('#dashb').click(()=> {
    let url = window.location.origin;
    window.location.replace(url+"/dashboard");
});

function downloadPDF() {
    const canvas = document.getElementById('mychart');
    const canvas2 = document.getElementById('mychart2');

    const canvasImage = canvas.toDataURL('image/jpeg',1.0);
    const canvasImage2 = canvas2.toDataURL('image/jpeg',1.0);
    
    let pdf = new jsPDF('landscape');
    pdf.setFontSize(20);
    pdf.addImage(canvasImage, 'JPEG', 10, 15, 280, 150);
    pdf.save('dataresults.pdf');
}