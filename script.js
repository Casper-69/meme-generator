const canvas = document.getElementById("memeCanvas");
const ctx = canvas.getContext("2d");
let image = new Image();

const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;

// Add text position tracking
let textPositions = {
  top: { x: canvas.width / 2, y: 50 },
  bottom: { x: canvas.width / 2, y: canvas.height - 20 }
};

let isDraggingText = false;
let draggedText = null;
let dragStartX = 0;
let dragStartY = 0;

// Add canvas mouse event listeners
canvas.addEventListener('mousedown', startDraggingText);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', stopDraggingText);
canvas.addEventListener('mouseleave', stopDraggingText);

// Touch events for mobile
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', stopDraggingText);

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  startDraggingText({ offsetX: x, offsetY: y });
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  dragText({ offsetX: x, offsetY: y });
}

function startDraggingText(e) {
  const x = e.offsetX;
  const y = e.offsetY;
  const topText = document.getElementById("topText").value.toUpperCase();
  const bottomText = document.getElementById("bottomText").value.toUpperCase();

  // Check if click is near either text
  if (isNearText(x, y, topText, textPositions.top)) {
    isDraggingText = true;
    draggedText = 'top';
    dragStartX = x - textPositions.top.x;
    dragStartY = y - textPositions.top.y;
  } else if (isNearText(x, y, bottomText, textPositions.bottom)) {
    isDraggingText = true;
    draggedText = 'bottom';
    dragStartX = x - textPositions.bottom.x;
    dragStartY = y - textPositions.bottom.y;
  }
}

function handleMouseMove(e) {
  const x = e.offsetX;
  const y = e.offsetY;
  const topText = document.getElementById("topText").value.toUpperCase();
  const bottomText = document.getElementById("bottomText").value.toUpperCase();

  // Change cursor if hovering over text
  if (isNearText(x, y, topText, textPositions.top) || 
      isNearText(x, y, bottomText, textPositions.bottom)) {
    canvas.style.cursor = 'move';
  } else {
    canvas.style.cursor = 'default';
  }

  // Handle dragging
  if (isDraggingText) {
    dragText(e);
  }
}

function dragText(e) {
  if (!isDraggingText) return;
  
  const x = e.offsetX;
  const y = e.offsetY;
  
  if (draggedText === 'top') {
    textPositions.top.x = x - dragStartX;
    textPositions.top.y = y - dragStartY;
  } else if (draggedText === 'bottom') {
    textPositions.bottom.x = x - dragStartX;
    textPositions.bottom.y = y - dragStartY;
  }
  
  drawMeme();
}

function stopDraggingText() {
  isDraggingText = false;
  draggedText = null;
}

function isNearText(x, y, text, position) {
  ctx.font = 'bold 40px Impact';
  const metrics = ctx.measureText(text);
  const width = metrics.width;
  const height = 40; // Approximate height of the text
  
  // Create a hit box around the text
  return x >= position.x - width/2 - 10 &&
         x <= position.x + width/2 + 10 &&
         y >= position.y - height - 10 &&
         y <= position.y + 10;
}

function clearTextInputs() {
  document.getElementById("topText").value = "";
  document.getElementById("bottomText").value = "";
}

document.getElementById("imageInput").addEventListener("change", function(e) {
  const reader = new FileReader();
  reader.onload = function(event) {
    image.onload = () => {
      // Calculate aspect ratio
      let width = image.width;
      let height = image.height;
      
      // Maintain aspect ratio while fitting within bounds
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = width * (MAX_HEIGHT / height);
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Center text positions when new image is loaded
      textPositions.top.x = width / 2;
      textPositions.top.y = 60;
      textPositions.bottom.x = width / 2;
      textPositions.bottom.y = height - 30;
      
      // Clear text inputs
      clearTextInputs();
      
      drawMeme();
    };
    image.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
});

function drawMeme() {
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  const topText = document.getElementById("topText").value.toUpperCase();
  const bottomText = document.getElementById("bottomText").value.toUpperCase();
  
  ctx.font = 'bold 40px Impact';
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.textAlign = "center";

  // Draw top text at its position
  ctx.fillText(topText, textPositions.top.x, textPositions.top.y);
  ctx.strokeText(topText, textPositions.top.x, textPositions.top.y);

  // Draw bottom text at its position
  ctx.fillText(bottomText, textPositions.bottom.x, textPositions.bottom.y);
  ctx.strokeText(bottomText, textPositions.bottom.x, textPositions.bottom.y);
}

function generateMeme() {
  drawMeme();
}

function downloadMeme() {
  const link = document.createElement("a");
  link.download = "meme.png";
  link.href = canvas.toDataURL();
  link.click();
}

function loadMemesFromImgflip() {
    fetch("https://api.imgflip.com/get_memes")
      .then(res => res.json())
      .then(data => {
        const memes = data.data.memes;
        const container = document.getElementById("presetMemes");
        container.innerHTML = ''; // Clear existing
  
        // Load all memes instead of just a subset
        memes.forEach(meme => {
          const img = document.createElement("img");
          img.src = meme.url;
          img.alt = meme.name;
          img.title = meme.name; // Add tooltip with meme name
          img.onclick = () => loadPreset(meme.url);
          container.appendChild(img);
        });

        // Add horizontal scroll with mousewheel
        container.addEventListener('wheel', (e) => {
          if (e.deltaY !== 0) {
            e.preventDefault();
            container.scrollLeft += e.deltaY + e.deltaX;
          }
        }, { passive: false });

        // Add mouse drag scrolling
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
          isDown = true;
          container.style.cursor = 'grabbing';
          startX = e.pageX - container.offsetLeft;
          scrollLeft = container.scrollLeft;
        });

        container.addEventListener('mouseleave', () => {
          isDown = false;
          container.style.cursor = 'grab';
        });

        container.addEventListener('mouseup', () => {
          isDown = false;
          container.style.cursor = 'grab';
        });

        container.addEventListener('mousemove', (e) => {
          if (!isDown) return;
          e.preventDefault();
          const x = e.pageX - container.offsetLeft;
          const walk = (x - startX) * 2;
          container.scrollLeft = scrollLeft - walk;
        });
      })
      .catch(err => console.error("Failed to load memes:", err));
}
  
window.onload = loadMemesFromImgflip;  

function loadPreset(src) {
    image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      // Calculate aspect ratio
      let width = image.width;
      let height = image.height;
      
      // Maintain aspect ratio while fitting within bounds
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = width * (MAX_HEIGHT / height);
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Center text positions for preset images
      textPositions.top.x = width / 2;
      textPositions.top.y = 60;
      textPositions.bottom.x = width / 2;
      textPositions.bottom.y = height - 30;
      
      // Clear text inputs
      clearTextInputs();
      
      drawMeme();
    };
    image.src = src;
}
  
const memeUrl = canvas.toDataURL();

document.getElementById("shareTwitter").href = 
  `https://twitter.com/intent/tweet?text=Check out my meme!&url=${encodeURIComponent(memeUrl)}`;

document.getElementById("shareWhatsApp").href = 
  `https://api.whatsapp.com/send?text=Check out my meme! ${encodeURIComponent(memeUrl)}`;
