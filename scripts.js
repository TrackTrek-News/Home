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
            fetchHTML(post.html_link); // Fetch HTML content if link is external
          } else {
            fetchHTML('https://raw.githubusercontent.com/TrackTrekk/_/main/' + post.html_link); // Fetch HTML content for local links
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

      const img = document.createElement('img');
      img.src = post.image;
      img.alt = post.title;

      const title = document.createElement('div');
      title.classList.add('box-title');
      title.textContent = post.title;

      const meta = document.createElement('div');
      meta.classList.add('box-meta');
      meta.textContent = `Posted on ${post.date}`;

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
          fetchHTML('https://raw.githubusercontent.com/TrackTrekk/_/main/' + post.html_link); // Fetch HTML content for local links
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
  function fetchHTML(htmlLink) {
    fetch(htmlLink)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(html => {
        console.log('Fetched HTML content:', html); // Debugging
        displayHTML(html);
      })
      .catch(error => console.error('Error fetching HTML:', error));
  }

// Function to show the overlay
function showOverlay(html) {
    // Save the current scroll position
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;

    // Create the overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.innerHTML = `
        <div class="post-content-container">
            <div class="text-container">${html}</div>
            <div class="tts-controls" style="display: none;">
                <br>
                <select id="voiceselection" aria-label="Voice selection"></select>
                <br>
                <label for="speedControl">Speed:</label>
                <input type="range" id="speedControl" min="0.1" max="2" step="0.1" value="1" aria-label="Speech speed">
                <span id="speedValue">1.0</span>
                <br>
                <input id="stopButton" type="button" value="Stop" aria-label="Stop speech"/>
            </div>
            <div class="tts-widget">
                <i class="fas fa-volume-up"></i> <!-- You can use any icon you like -->
            </div>
        </div>
        <div class="close-button"><i class="fas fa-times"></i></div>
    `;

    // Append the overlay to the body
    document.body.appendChild(overlay);

    // Prevent background scrolling
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';

    // Add event listener to the close button
    overlay.querySelector('.close-button').addEventListener('click', function() {
        // Remove the overlay and restore background scrolling
        document.body.removeChild(overlay);
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollPosition); // Restore scroll position
        if (ttsInstance) {
            ttsInstance.stop(); // Stop TTS when closing the overlay
        }
        renderPosts(postsData); // Re-render posts after closing
    });

    // Populate voice selection dropdown
    function populateVoices() {
        var voicelist = responsiveVoice.getVoices();
        var vselect = document.getElementById('voiceselection');
        vselect.innerHTML = ''; // Clear existing options

        if (voicelist.length === 0) {
            setTimeout(populateVoices, 100); // Retry if voices are not yet loaded
            return;
        }

        voicelist.forEach(function(voice) {
            var option = document.createElement('option');
            option.value = voice.name;
            option.textContent = voice.name;
            vselect.appendChild(option);
        });
    }

    populateVoices(); // Call the function to populate voices

    // Update the speed value display
    document.getElementById('speedControl').addEventListener('input', function() {
        document.getElementById('speedValue').textContent = this.value;
    });

    // Function to read and highlight text
    let sentences = [];
    let currentSentenceIndex = -1;
    let ttsInstance = null;

    // Function to split text into sentences and wrap them in spans
    function splitTextIntoSentences(text) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        const elements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, sub');
        sentences = [];
        elements.forEach(el => {
            const text = el.innerText;
            text.split(/(?<=[.!?])\s+/).forEach(sentence => {
                if (sentence.trim()) sentences.push(sentence.trim());
            });
        });

        let wrappedText = text;
        sentences.forEach((sentence, index) => {
            const wrappedSentence = `<span class="sentence" data-index="${index}">${sentence}</span>`;
            wrappedText = wrappedText.replace(sentence, wrappedSentence);
        });

        return wrappedText;
    }

    const initialText = overlay.querySelector('.text-container').innerHTML;
    const wrappedText = splitTextIntoSentences(initialText);
    overlay.querySelector('.text-container').innerHTML = wrappedText;

    function speakAndHighlight(startIndex = 0) {
        const textInput = overlay.querySelector('.text-container').innerHTML;
        const selectedVoiceName = document.getElementById('voiceselection').value;
        const speed = document.getElementById('speedControl').value;

        function highlightSentence(index) {
            if (index >= sentences.length) return; // Stop if index is out of bounds

            const textArea = overlay.querySelector('.text-container');
            const currentSentence = sentences[index];
            const highlightedHTML = textInput.replace(currentSentence, `<mark>${currentSentence}</mark>`);
            textArea.innerHTML = highlightedHTML;
            addClickEventToSentences(); // Re-add click events after highlighting

            // Scroll the highlighted sentence into view
            const sentenceElement = textArea.querySelector(`[data-index="${index}"]`);
            if (sentenceElement) {
                sentenceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function speakNext() {
            if (currentSentenceIndex < sentences.length - 1) {
                currentSentenceIndex++;
                const currentSentence = sentences[currentSentenceIndex];
                responsiveVoice.speak(currentSentence, selectedVoiceName, {
                    rate: speed, // Adjust the rate of speech
                    onend: function() {
                        highlightSentence(currentSentenceIndex);
                        speakNext();
                    }
                });
                highlightSentence(currentSentenceIndex);
            }
        }

        currentSentenceIndex = startIndex;
        ttsInstance = { stop: () => responsiveVoice.cancel() }; // Create TTS instance
        speakNext();
        return ttsInstance; // Return TTS instance
    }

    // Handle Stop/Pause button
    document.getElementById('stopButton').addEventListener('click', function() {
        if (ttsInstance) {
            ttsInstance.stop(); // Stop speech
        }
    });

    // Add click event to sentences for manual selection
    function addClickEventToSentences() {
        const textArea = overlay.querySelector('.text-container');
        const spans = textArea.querySelectorAll('.sentence');

        spans.forEach((span, index) => {
            span.addEventListener('click', () => {
                if (ttsInstance) {
                    ttsInstance.stop(); // Stop ongoing TTS
                }
                currentSentenceIndex = index; // Set current sentence index to clicked one
                ttsInstance = speakAndHighlight(index); // Start reading from the selected sentence
            });
        });
    }

    // Initial call to add click events to sentences
    addClickEventToSentences();

    // Add event listener to widget icon to toggle TTS controls
    const ttsWidget = overlay.querySelector('.tts-widget');
    const ttsControls = overlay.querySelector('.tts-controls');
    ttsWidget.addEventListener('click', function() {
        if (ttsControls.style.display === 'none') {
            ttsControls.style.display = 'block';
        } else {
            ttsControls.style.display = 'none';
        }
    });

    // Show the overlay
    overlay.style.display = 'block';
}

// Function to display HTML content in the overlay
function displayHTML(html) {
    showOverlay(html);
}


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
