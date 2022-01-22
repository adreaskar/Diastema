$(document).ready(function() {

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

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
        toastr.info(message, "Notification: ");
        window.location.reload();
    });

});