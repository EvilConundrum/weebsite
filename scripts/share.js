const dropArea = document.getElementById('drop-area');
const imageInput = document.getElementById('image-upload');
const preview = document.getElementById('preview');
const label = dropArea.querySelector('p'); // Target the label text

dropArea.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', handleFile);

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.classList.add('highlight');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.classList.remove('highlight');
    });
});

dropArea.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile({ target: { files: [file] } });
});

function handleFile(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            label.style.display = 'none';
        };

        reader.readAsDataURL(file);
    }
}
