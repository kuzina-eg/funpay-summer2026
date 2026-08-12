export default function countDown() {
    const countdown = document.querySelector('.js-countdown');

    if (countdown) {
        // Set the date we're counting down to
        const countDownDate = new Date("Aug 1, 2026 00:00:00").getTime();

        // Update the count down every 1 second
        const x = setInterval(function () {

            // Get today's date and time
            const now = new Date().getTime();

            // Find the distance between now and the count down date
            const distance = countDownDate - now;

            // Time calculations for days, hours, minutes and seconds
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Display the result in the elements
            countdown.querySelector('.js-days').innerHTML = days;
            countdown.querySelector('.js-hours').innerHTML = hours;
            countdown.querySelector('.js-minutes').innerHTML = minutes;
            // document.getElementById("demo").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

            // If the count down is finished, write some text
            if (distance < 0) {
                clearInterval(x);
                countdown.querySelector('.js-days').innerHTML = 0;
                countdown.querySelector('.js-hours').innerHTML = 0;
                countdown.querySelector('.js-minutes').innerHTML = 0;
            }
        }, 1000);
    }
}
