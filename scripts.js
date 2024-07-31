document.addEventListener('DOMContentLoaded', function() {

  const boxContainer = document.querySelector('.box-container');

  const searchInput = document.querySelector('.search-container input[type="text"]');

  const githubRawLink = 'https://raw.githubusercontent.com/TrackTrekk/_/main/posts.json'; // Replace with your actual link



  let postsData = [];



  // Fetch JSON data

  fetch(githubRawLink)

    .then(response => response.json())

    .then(data => {

      console.log('Fetched JSON data:', data); // Debugging

      postsData = data;

      renderPosts(postsData);



      // Check URL for postId parameter and show the post

      const urlParams = new URLSearchParams(window.location.search);

      const postId = urlParams.get('post');

      if (postId) {

        const post = postsData.find(p => slugify(p.title) === postId);

        if (post) {

          renderPosts([post]); // Show only the specific post

          if (post.html_link.startsWith('http')) {

            fetchHTML(post.html_link, post.image); // Fetch HTML content if link is external

          } else {

            fetchHTML('https://raw.githubusercontent.com/TrackTrekk/_/main/' + post.html_link, post.image); // Fetch HTML content for local links

          }

          updateMetaTags(post); // Update meta tags

        }

      }

    })

    .catch(error => console.error('Error fetching JSON:', error));



  // Function to render posts

  function renderPosts(posts) {

    boxContainer.innerHTML = ''; // Clear the container before rendering

    posts.forEach(post => {

      const box = document.createElement('div');

      box.classList.add('box');

      box.setAttribute('data-href', post.html_link); // Use the HTML link from JSON

      box.setAttribute('data-image', post.image); // Store the image link in the data attribute



      const img = document.createElement('img');

      img.src = post.image;

      img.alt = post.title;



      const title = document.createElement('div');

      title.classList.add('box-title');

      title.textContent = post.title;



      const meta = document.createElement('div');

      meta.classList.add('box-meta');

      meta.textContent = `Posted on ${post.date}  • [ ${post.type} ]`;

      const content = document.createElement('div');

      content.classList.add('box-content');

      content.innerHTML = `<p>${post.content}</p>`;



      box.appendChild(img);

      box.appendChild(title);

      box.appendChild(meta);

      box.appendChild(content);



      // Create and add share button

      const shareButton = document.createElement('div');

      shareButton.classList.add('share-button');

      shareButton.innerHTML = '<i class="fas fa-share"></i>';



      const dropdown = document.createElement('div');

      dropdown.classList.add('dropdown');

      dropdown.innerHTML = `

        <div class="dropdown-content">

          <a href="#" class="share-link" data-platform="facebook"><i class="fab fa-facebook"></i> Share on Facebook</a>

          <a href="#" class="share-link" data-platform="twitter"><i class="fab fa-twitter"></i> Share on Twitter</a>

          <a href="#" class="share-link" data-platform="linkedin"><i class="fab fa-linkedin"></i> Share on LinkedIn</a>

          <a href="#" class="copy-link"><i class="fas fa-link"></i> Copy Link</a>

        </div>

      `;

      shareButton.appendChild(dropdown);

      box.appendChild(shareButton);



      // Add event listener for box navigation

      box.addEventListener('click', function() {

        console.log('Box clicked, fetching HTML:', post.html_link); // Debugging

        if (post.html_link.startsWith('http')) {

          window.open(post.html_link, '_blank'); // Open external link in a new tab

        } else {

          fetchHTML('https://raw.githubusercontent.com/TrackTrekk/_/main/' + post.html_link, post.image); // Fetch HTML content for local links

        }

        updateMetaTags(post); // Update meta tags

      });



      // Prevent share button click from triggering box click

      shareButton.addEventListener('click', function(event) {

        event.stopPropagation();

        dropdown.classList.toggle('active');

      });



      // Share links functionality

      const shareLinks = dropdown.querySelectorAll('.share-link');

      shareLinks.forEach(link => {

        link.addEventListener('click', function(event) {

          event.preventDefault();

          const platform = link.getAttribute('data-platform');

          const shareUrl = buildShareUrl(platform, post.html_link, post.title); // Use the HTML link from JSON

          window.open(shareUrl, '_blank'); // Open in a new tab

          console.log('Sharing on:', platform, 'Link:', shareUrl); // Debugging

        });

      });



      // Copy link functionality

      const copyLink = dropdown.querySelector('.copy-link');

      copyLink.addEventListener('click', function(event) {

        event.preventDefault();

        copyToClipboard(window.location.origin + window.location.pathname + '?post=' + slugify(post.title)); // Use slugified title for postId

        alert('Link copied to clipboard');

      });



      boxContainer.appendChild(box);

    });

  }



// Function to fetch HTML content
function fetchHTML(htmlLink, imageUrl) {
  fetch(htmlLink)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(html => {
      console.log('Fetched HTML content:', html); // Debugging
      displayHTML(html, imageUrl);
    })
    .catch(error => console.error('Error fetching HTML:', error));
}

function displayHTML(html, imageUrl) {
  // Save the current scroll position
  const scrollPosition = window.scrollY;

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');

  // Create a container for the HTML content
  const postContentContainer = document.createElement('div');
  postContentContainer.classList.add('post-content-container');
  postContentContainer.innerHTML = html;

  // Insert the image link into the <img class="p-img" src="" alt="Song Cover"> tag
  const imgTag = postContentContainer.querySelector('img.p-img');
  if (imgTag) {
    imgTag.src = imageUrl;
  }

  // Create a close button
  const closeButton = document.createElement('div');
  closeButton.classList.add('close-button');
  closeButton.innerHTML = '<i class="fas fa-times"></i>';
  postContentContainer.appendChild(closeButton);

  // Create a widget icon
  const widgetIcon = document.createElement('div');
  widgetIcon.classList.add('widget-icon');
  widgetIcon.innerHTML = '<i class="fas fa-volume-up"></i>';

  // Create widget controls
  const widgetControls = document.createElement('div');
  widgetControls.classList.add('widget-controls');
  widgetControls.innerHTML = `
    <div style="margin-bottom:15px">
      <label for="voiceselection">Voice:</label>
      <select id="voiceselection" aria-label="Voice selection"></select>
    </div>
    <div style="margin-bottom:5px">
      <label for="speedControl">Speed:</label>
      <input type="range" id="speedControl" min="0.1" max="2" step="0.1" value="1" aria-label="Speech speed">
      <span id="speedValue">1.0</span>
    </div>
    <div>
      <input id="readButton" type="button" value="Read this for me" aria-label="Read text"/>
      <input id="stopButton" type="button" class="stop-button" value="Stop" aria-label="Stop reading"/>
    </div>
  `;

  // Append the content and widgets to the overlay
  overlay.appendChild(postContentContainer);
  overlay.appendChild(widgetIcon);
  overlay.appendChild(widgetControls);

  // Append overlay to the body
  document.body.appendChild(overlay);

  // Disable background scroll
  document.body.style.overflow = 'hidden';

  // Add event listener to close button
  closeButton.addEventListener('click', function() {
    document.body.removeChild(overlay); // Remove overlay from the body
    document.body.style.overflow = ''; // Restore background scroll

    // Restore the scroll position of the background
    window.scrollTo(0, scrollPosition);

    // Stop TTS when overlay is closed
    responsiveVoice.cancel();
  });

  // Add event listener to widget icon to toggle controls
  widgetIcon.addEventListener('click', function() {
    widgetControls.style.display = (widgetControls.style.display === 'block') ? 'none' : 'block';
  });

  // Add scroll event listener to keep close button visible while scrolling
  postContentContainer.addEventListener('scroll', function() {
    closeButton.style.display = 'block'; // Show close button while scrolling
  });

  // Populate voices and handle speech
  function populateVoices() {
    var voicelist = responsiveVoice.getVoices();
    var vselect = $("#voiceselection");
    vselect.empty(); // Clear existing options

    if (voicelist.length === 0) {
      setTimeout(populateVoices, 100); // Retry if voices are not yet loaded
      return;
    }

    $.each(voicelist, function() {
      vselect.append($("<option />").val(this.name).text(this.name));
    });
  }

  populateVoices(); // Call the function to populate voices

  // Update the speed value display
  $('#speedControl').on('input', function() {
    $('#speedValue').text($(this).val());
  });

  let isSpeaking = false;
  let currentSentenceIndex = 0;
  let sentences = [];

  function extractAndHighlightSentences() {
    const elements = postContentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6, h7, h8, h9, h10, p, sub');
    sentences = [];

    elements.forEach(el => {
      const text = el.innerText;
      // Clear the element's content
      el.innerHTML = '';

      // Split text into sentences based on common sentence delimiters
      text.split(/(?<=[.!?])\s+/).forEach((sentence, index) => {
        if (sentence.trim()) {
          const span = document.createElement('span');
          span.innerText = sentence.trim();
          span.classList.add('sentence');
          span.dataset.index = sentences.length;
          sentences.push({ text: sentence.trim(), element: span });

          // Add space after the sentence
          const space = document.createTextNode(' ');

          el.appendChild(span);
          el.appendChild(space);
        }
      });
    });

    // Attach click event to each sentence
    postContentContainer.querySelectorAll('.sentence').forEach(span => {
      span.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        currentSentenceIndex = index;
        highlightSentence(index);
        stopSpeaking(); // Stop any ongoing speech
        speakFromCurrentIndex();
      });
    });
  }

  function highlightSentence(index) {
    if (index >= sentences.length) return; // Stop if index is out of bounds

    // Clear previous highlights
    postContentContainer.querySelectorAll('.selected-sentence').forEach(el => {
      el.classList.remove('selected-sentence');
    });

    const sentence = sentences[index];
    const span = sentence.element;
    span.classList.add('selected-sentence');
    span.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Scroll the element into view
  }

  function speakNext() {
    if (currentSentenceIndex < sentences.length) {
      const currentSentence = sentences[currentSentenceIndex];
      responsiveVoice.speak(currentSentence.text, $('#voiceselection').val(), {
        rate: $('#speedControl').val(), // Adjust the rate of speech
        onend: function() {
          currentSentenceIndex++;
          highlightSentence(currentSentenceIndex);
          if (isSpeaking) speakNext(); // Continue speaking if not stopped
        }
      });
      highlightSentence(currentSentenceIndex);
    } else {
      isSpeaking = false; // Finished speaking
    }
  }

  function speakAndHighlight() {
    if (isSpeaking) return; // Prevent multiple instances of TTS
    isSpeaking = true;
    speakNext();
  }

  function speakFromCurrentIndex() {
    if (isSpeaking) return; // Prevent multiple instances of TTS
    isSpeaking = true;
    speakNext();
  }

  function stopSpeaking() {
    responsiveVoice.cancel();
    isSpeaking = false;
  }

  extractAndHighlightSentences(); // Extract sentences and make them clickable

  $('#readButton').on('click', function() {
    if (!isSpeaking) {
      speakFromCurrentIndex();
    }
  });

  $('#stopButton').on('click', function() {
    stopSpeaking();
  });

  // Function to dynamically update the image in the overlay
  function updateOverlayImage(post) {
    const overlayImage = document.querySelector('.overlay .p-img');
    if (overlayImage) {
      overlayImage.src = post.image;
      overlayImage.alt = post.title;
    }
  }

  // Update social media icons in the overlay when the overlay is opened
  updateSocialMediaIcons();
}

// Function to dynamically update social media icons
function updateSocialMediaIcons() {
  const socialMediaIcons = {
    "facebook-icon": '<i class="fab fa-facebook"></i>',
    "itunes-icon": '<i class="fab fa-itunes"></i>',
    "instagram-icon": '<i class="fab fa-instagram"></i>',
    "youtube-icon": '<i class="fab fa-youtube"></i>',
    "spotify-icon": '<i class="fab fa-spotify"></i>',
    "deezer-icon": '<i class="fab fa-deezer"></i>',
    "tt-icon": '<svg class="tracktrek-icon" version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><path d="M226.9 49c-77.1 9.7-140.2 67.1-157.4 143-3.5 15.5-4.5 28.1-4.5 58.4 0 14.9-.3 28-.6 29.1-.3 1.2-2.8 3.1-6.4 4.8-8 3.7-15 11-19.6 20.1-3.1 6.5-3.7 8.7-4.1 16.3-.5 8.5-.2 10 9.1 46.8 10.4 41 12.7 47.5 20.1 55.4 8.2 8.7 24.5 15 35.5 13.7 4.4-.5 4.6-.4 7.5 3.6 3.8 5.3 10.4 10.4 15.3 11.8 5.5 1.5 17.1 1.2 23.2-.6 13.8-4.1 22.4-14.5 23.6-28.6.5-5.5-.3-9.6-6.1-32.3-3.6-14.3-11.3-44.7-17.1-67.5-14.8-58.1-14.1-55.9-18-61.8-3.7-5.6-10.2-10.5-16.8-12.4l-3.9-1.2.6-17.5c.9-26.9 5.2-43.7 16.4-65 20.6-39.3 58.2-66.8 102.3-74.8 19.8-3.6 45.7-1.9 66 4.3 35.4 10.9 66.9 37.2 84.3 70.5 11.2 21.3 15.5 38.1 16.4 65l.6 17.5-3.9 1.2c-6.6 1.9-13.1 6.8-16.8 12.4-3.9 5.9-3.2 3.7-18 61.8-5.8 22.8-13.5 53.2-17.1 67.5-5.8 22.7-6.6 26.8-6.1 32.3 1.2 14.1 9.8 24.5 23.6 28.6 6.1 1.8 18.7 2.1 24.2.6 4.8-1.4 11.5-6.5 15.3-11.7 2.9-4 3.2-4.2 7.5-3.7 5.8.7 17.4-1.7 23.8-5 7.5-3.8 15.7-12.3 19.2-19.8 4.1-9 22-80.9 22-88.6 0-6.3-2-14.4-5.2-20.5-4-7.9-16.1-18.5-23.2-20.3l-2.6-.6v-29.4c0-38.8-1.7-54-8.7-75.9-5.4-17-16.1-38.2-26.8-53-4.3-6-20.3-24.3-22-25.3-.8-.4-3.3-2.5-5.7-4.8-16.2-15.1-42.8-30-66.4-37.2-19.7-6-29-7.4-51.9-7.8-11.5-.1-24 .1-27.6.6m49.6 14.5c60 9.3 110.6 50.2 133.4 107.8 7.8 19.5 11.1 38.6 11.1 63.5V253l-2.2-1.4c-1.3-.8-4-1.8-6.1-2.1-2-.4-4-1.2-4.4-1.8s-.8-8.3-.9-17.2c-.3-26.7-4.7-45.3-16.4-69-21.5-43.4-60.9-73.6-110-84.2-6.8-1.4-13-1.8-30.5-1.8s-23.7.4-30.5 1.8c-21.8 4.7-44.1 14.4-60.9 26.4-11.8 8.5-26.6 23-35.4 34.8-7.2 9.6-19.1 32.5-22.6 43.5-5.4 17-8.1 35.7-8.1 56.2v9.7l-4.9 1.5c-2.7.8-5.9 1.9-7 2.6-2.1 1.1-2.1 1-2.1-17.2 0-31.3 5.1-53 18.6-80 11.7-23.4 32.9-47.7 54.7-62.9 20.9-14.4 47.5-25 71.7-28.4 5.8-.8 11.9-1.7 13.5-1.9 5.5-.8 28.9.3 39 1.9M108.6 262.9c7.6 3.5 9 6.4 16.4 35.9 3.8 14.7 11.9 46.5 18.1 70.7s11.5 46.7 11.7 50c.3 5.2-.1 6.6-2.4 10.2-4.1 6.2-11.2 9.8-19.4 9.8-11.2 0-16.6-5-20-18.8-1-4-6.6-26.1-12.5-49.2C79.2 287.6 79 286.9 79 279.9c0-6.3.2-6.8 4.1-11.3 6.3-7.1 17-9.6 25.5-5.7m299.1-.4c3.9 1.2 6.2 2.7 9.2 6.2 3.9 4.4 4.1 4.9 4.1 11.2 0 7-.2 7.7-21.5 91.6-5.9 23.1-11.5 45.2-12.5 49.2-3.4 13.5-8.8 18.8-19.5 18.8-7.7 0-14.9-3.8-18.9-9.8-2.3-3.6-2.7-5-2.4-10.2.2-3.3 5-23.8 10.5-45.5 5.6-21.7 13.6-53 17.7-69.5 4.2-16.5 8.3-31.4 9.2-33.2 4.6-9 13.1-12.1 24.1-8.8M71.4 313C81.3 351.9 99 421.9 99 422.6c0 1.3-10.8-.4-15.3-2.4-6-2.7-12.4-8.6-15.1-14.1-2-3.9-18-64.4-20.8-78.1-2-10.5 4.1-23.8 14-30.1 2.5-1.6 4.7-2.8 4.8-2.6.2.1 2.3 8.1 4.8 17.7m368.8-13.7c8.4 6.4 13.8 19.3 11.9 28.7-2.6 13.5-18.7 74.2-20.7 78.1-2.7 5.5-9.1 11.4-15 14.1-4.7 2-14.4 3.6-14.4 2.3 0-.4 6.1-24.9 13.6-54.4s14.3-56.3 15-59.6c2.1-8.6 3.4-12.5 4.4-12.5.5 0 2.8 1.5 5.2 3.3"/><path d="M245 252c-2 2-2 3.3-2 85s0 83 2 85c2.6 2.6 8.1 2.6 10.3.2 1.6-1.7 1.7-9.1 1.7-85.4 0-79.6-.1-83.6-1.8-85.1-2.5-2.3-7.8-2.1-10.2.3m-24.6 30.4c-1.8 1.4-1.9 3.3-2.2 52.3-.1 27.9 0 51.8.3 53 .8 3.4 3.3 5.3 6.9 5.3 6.9 0 6.6 2.2 6.6-56.3 0-46.4-.2-52.7-1.6-54.1-1.9-2-7.4-2.1-10-.2m49.2.2c-1.4 1.4-1.6 7.7-1.6 54.3 0 49.9.1 52.9 1.8 54.4 2.3 2.1 8.6 2.2 10.6.1.9-.8 1.8-2.5 2.1-3.7s.4-25.1.3-53c-.3-49-.4-50.9-2.2-52.3-2.6-1.9-9.1-1.8-11 .2m-73.7 18.3-2.4 1.9v68.4l2.4 1.9c3.2 2.6 6.7 2.4 9.6-.6l2.5-2.4v-66.2l-2.5-2.4c-2.9-3-6.4-3.2-9.6-.6m98.6.6-2.5 2.4v66.2l2.5 2.4c2.9 3 7.4 3.2 10.6.6l2.4-1.9v-68.4l-2.4-1.9c-3.2-2.6-7.7-2.4-10.6.6m-122 10.7c-1.1.6-2.3 1.6-2.7 2.2s-.8 10.8-.8 22.7c0 24.3.2 24.9 7.3 24.9 6.3 0 6.7-1.5 6.7-25.3 0-20.7 0-20.8-2.5-23.2-2.6-2.7-4.9-3.1-8-1.3m147 1.3c-2.5 2.4-2.5 2.5-2.5 23.2 0 24.3.3 25.3 7.4 25.3 7.5 0 7.6-.5 7.6-25.1 0-11.8-.4-21.9-.8-22.5-1.1-1.6-4.8-3.4-7.2-3.4-1.1 0-3.2 1.1-4.5 2.5"/></svg>',
  };

  // Update icons in the main content
  for (const [id, iconHTML] of Object.entries(socialMediaIcons)) {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = iconHTML;
    }
  }

  // Update icons in the overlay
  for (const [id, iconHTML] of Object.entries(socialMediaIcons)) {
    const element = document.getElementById(`${id}-overlay`);
    if (element) {
      element.innerHTML = iconHTML;
    }
  }
}

// Initial call to update social media icons on page load
updateSocialMediaIcons();

// Event listener to pass the fetched image and update social media icons in the overlay
document.addEventListener('click', function(event) {
  const target = event.target;
  if (target.classList.contains('box')) {
    const postId = target.getAttribute('data-href');
    const post = postsData.find(p => p.html_link === postId);
    if (post) {
      updateOverlayImage(post);
      fetchHTML(post.html_link, post.image);
    }
  }
});







  // Function to build share URLs

  function buildShareUrl(platform, href, title) {

    const shareLink = window.location.origin + window.location.pathname + '?post=' + slugify(title);

    switch(platform) {

      case 'facebook':

        return 'https://www.facebook.com/sharer.php?u=' + encodeURIComponent(shareLink);

      case 'twitter':

        return 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(shareLink) + '&text=' + encodeURIComponent(title);

      case 'linkedin':

        return 'https://www.linkedin.com/shareArticle?url=' + encodeURIComponent(shareLink) + '&title=' + encodeURIComponent(title);

      default:

        return '#';

    }

  }



  // Function to copy text to clipboard

  function copyToClipboard(text) {

    const el = document.createElement('textarea');

       el.value = text;

    document.body.appendChild(el);

    el.select();

    document.execCommand('copy');

    document.body.removeChild(el);

  }



  // Slugify function for titles

  function slugify(text) {

    return text.toString().toLowerCase()

      .replace(/\s+/g, '-')           // Replace spaces with -

      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars

      .replace(/\-\-+/g, '-')         // Replace multiple - with single -

      .replace(/^-+/, '')             // Trim - from start of text

      .replace(/-+$/, '');            // Trim - from end of text

  }



  // Function to update meta tags dynamically

  function updateMetaTags(post) {

    // Update title

    document.title = post.title + " - TrackTrek News";



    // Update meta description

    const metaDescription = document.querySelector('meta[name="description"]');

    if (metaDescription) {

      metaDescription.setAttribute('content', post.content);

    }



    // Update meta keywords

    const metaKeywords = document.querySelector('meta[name="keywords"]');

    if (metaKeywords) {

      metaKeywords.setAttribute('content', post.tags.join(', '));

    }



    // Update Open Graph and Twitter meta tags

    const ogTitle = document.querySelector('meta[property="og:title"]');

    if (ogTitle) {

      ogTitle.setAttribute('content', post.title);

    }



    const ogDescription = document.querySelector('meta[property="og:description"]');

    if (ogDescription) {

      ogDescription.setAttribute('content', post.content);

    }



    const ogImage = document.querySelector('meta[property="og:image"]');

    if (ogImage) {

      ogImage.setAttribute('content', post.image);

    }



    const ogUrl = document.querySelector('meta[property="og:url"]');

    if (ogUrl) {

      ogUrl.setAttribute('content', window.location.href);

    }



    const twitterTitle = document.querySelector('meta[name="twitter:title"]');

    if (twitterTitle) {

      twitterTitle.setAttribute('content', post.title);

    }



    const twitterDescription = document.querySelector('meta[name="twitter:description"]');

    if (twitterDescription) {

      twitterDescription.setAttribute('content', post.content);

    }



    const twitterImage = document.querySelector('meta[name="twitter:image"]');

    if (twitterImage) {

      twitterImage.setAttribute('content', post.image);

    }

  }



  // Close dropdown when clicking outside

  document.addEventListener('click', function(event) {

    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {

      if (!dropdown.contains(event.target)) {

        dropdown.classList.remove('active');

      }

    });

  });



  // Search functionality

  searchInput.addEventListener('input', function() {

    const query = searchInput.value.toLowerCase();

    const filteredPosts = postsData.filter(post => {

      const date = post.date.toLowerCase();

      const tags = post.tags ? post.tags.map(tag => tag.toLowerCase()).join(' ') : '';

      return post.title.toLowerCase().includes(query) || date.includes(query) || tags.includes(query);

    });

    renderPosts(filteredPosts);

  });



  // Other existing functions for navbar, search, etc.

  

  const searchContainer = document.querySelector('.search-container');

  const searchIcon = document.querySelector('.search-icon');





  window.toggleSearch = function() {

    searchContainer.style.display = (searchContainer.style.display === 'block') ? 'none' : 'block';

    searchIcon.classList.toggle('active');

  }



  window.addEventListener('scroll', function() {

    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {

      dropdown.classList.remove('active');

    });

    

    searchContainer.style.display = 'none';

    searchIcon.classList.remove('active');

  });

});



function toggleMenu() {



            const navbar = document.querySelector('.navbar');



            navbar.classList.toggle('active');

        }



        function toggleDropdown(id) {

            const dropdown = document.getElementById(id);

            dropdown.classList.toggle('active');

            document.querySelectorAll('.dropdown-toggle').forEach(toggle => {

                if (toggle.getAttribute('onclick').includes(id)) {

                    toggle.classList.toggle('active');

                } else {

                    toggle.classList.remove('active');

                    document.getElementById(toggle.getAttribute('onclick').split("'")[1]).classList.remove('active');

                }

            });

        }



        document.addEventListener('click', (event) => {

            const navbar = document.querySelector('.navbar');

            const menuToggle = document.querySelector('.menu-toggle');

            if (!navbar.contains(event.target) && !menuToggle.contains(event.target)) {

                navbar.classList.remove('active');

            }

        });



        window.addEventListener('scroll', () => {

            const navbar = document.querySelector('.navbar');

            navbar.classList.remove('active');

        });
