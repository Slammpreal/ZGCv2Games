// Fade-in on scroll
document.addEventListener("DOMContentLoaded", () => {
  const fadeInElems = document.querySelectorAll(".fade-in");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      }
    });
  });

  fadeInElems.forEach(el => observer.observe(el));
});

// Launch video
document.getElementById("launch").addEventListener("click", addVideoPlayer);
document.getElementById("copy").addEventListener("click", copy_link);
document.getElementById("link").addEventListener("keypress", e => {
  if (e.key === "Enter") addVideoPlayer();
});

function addVideoPlayer() {
  const url = document.getElementById("link").value;
  if (!url) return;

  const videoId = extractVideoId(url);
  if (!videoId) {
    alert("Invalid YouTube link");
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.width = "560";
  iframe.height = "315";
  iframe.allowFullscreen = true;

  const embed1 = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
  const embed2 = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

  iframe.src = embed1;

  // Fallback to nocookie if blocked
  let triedFallback = false;
  setTimeout(() => {
    if (!triedFallback && iframe.contentDocument === null) {
      iframe.src = embed2;
      triedFallback = true;
    }
  }, 1500);

  document.getElementById("videoPlayersContainer").appendChild(iframe);
}

function extractVideoId(url) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return match ? match[1] : null;
}

function copy_link() {
  const val = document.getElementById("link").value;
  if (!val) return;
  navigator.clipboard.writeText(val);
  alert("Copied link!");
}

function home() {
  alert("Home clicked (implement navigation)");
}

function suggestions() {
  alert("Suggestions clicked (implement navigation)");
}

function aboutblank() {
  const win = window.open();
  win.document.write(`<iframe src="${location.href}" frameborder="0" style="width:100%;height:100%;"></iframe>`);
}
