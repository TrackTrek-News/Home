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
}

// Event listener to pass the fetched image to the overlay
document.addEventListener('click', function(event) {
  const target = event.target;
  if (target.classList.contains('box')) {
    const postId = target.getAttribute('data-href');
    const post = postsData.find(p => p.html_link === postId);
    if (post) {
      updateOverlayImage(post);
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
  const navbar = document.querySelector('.navbar');
  const searchContainer = document.querySelector('.search-container');
  const searchIcon = document.querySelector('.search-icon');

  window.toggleMenu = function() {
    navbar.classList.toggle('active');
  }

  window.toggleSearch = function() {
    searchContainer.style.display = (searchContainer.style.display === 'block') ? 'none' : 'block';
    searchIcon.classList.toggle('active');
  }

  window.addEventListener('scroll', function() {
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('active');
    });
    navbar.classList.remove('active');
    searchContainer.style.display = 'none';
    searchIcon.classList.remove('active');
  });
});
