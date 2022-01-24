$(document).ready(function() {

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

    socket.on('Dashboard', (message) => {
        toastr.info(message.notif, "Notification: ");

        // $('form').each(function() {
        //     let obj = $(this.childNodes[1].childNodes[1].childNodes[3].childNodes[3]);
        //     let objid = obj.html().replace(/[\[\]']+/g,'');

        //     if (objid === message.file) {
        //         console.log("Success");
        //     }

        //     let div = $(this.childNodes[1].childNodes[1].childNodes[7]);
        //     div.append(`<button type="submit" class="btn btn-primary" style="font-size:15px;position: absolute;right: 15px;" id="submit">View Results</button>`);
        // });

        window.location.reload();
    });

});