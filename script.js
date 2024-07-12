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

      // Check for postId in URL
      const queryParams = getQueryParams();
      if (queryParams.post) {
        const postId = queryParams.post;
        const specificPost = postsData.find(post => slugify(post.title) === postId);
        if (specificPost) {
          fetchHTML(specificPost.html_link);
        }
      }
    })
    .catch(error => console.error('Error fetching JSON:', error));

  // Function to render posts
  function renderPosts(posts) {
    boxContainer.innerHTML = ''; // Clear the container before rendering
    posts.forEach(post => {
      const postId = slugify(post.title);

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
        fetchHTML(post.html_link); // Fetch HTML content on click
      });

      // Share button functionality
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
          const shareUrl = buildShareUrl(platform, postId, post.title); // Use the post title slug
          // window.open(shareUrl, '_blank'); // Remove to prevent opening in new tab
          console.log('Sharing on:', platform, 'Link:', shareUrl); // Debugging
        });
      });

      // Copy link functionality
      const copyLink = dropdown.querySelector('.copy-link');
      copyLink.addEventListener('click', function(event) {
        event.preventDefault();
        copyToClipboard(window.location.origin + window.location.pathname + '?post=' + postId); // Copy the shareable link with post title slug
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

  // Function to display HTML content
  function displayHTML(html) {
    // Clear existing content
    boxContainer.innerHTML = '';

    // Create a container for the HTML content
    const postContentContainer = document.createElement('div');
    postContentContainer.classList.add('post-content-container');
    postContentContainer.innerHTML = html;

    // Create a close button
    const closeButton = document.createElement('div');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    postContentContainer.appendChild(closeButton);

    // Append the content to the box container
    boxContainer.appendChild(postContentContainer);

    // Add event listener to close button
    closeButton.addEventListener('click', function() {
      boxContainer.removeChild(postContentContainer);
      renderPosts(postsData); // Re-render all posts when overlay is closed
    });

    // Add scroll event listener to keep close button visible while scrolling
    postContentContainer.addEventListener('scroll', function() {
      closeButton.style.display = 'block'; // Show close button while scrolling
    });
  }

  // Function to build share URLs
  function buildShareUrl(platform, postId, title) {
    const href = window.location.origin + window.location.pathname + '?post=' + postId;
    switch(platform) {
      case 'facebook':
        return 'https://www.facebook.com/sharer.php?u=' + encodeURIComponent(href);
      case 'twitter':
        return 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(href) + '&text=' + encodeURIComponent(title);
      case 'linkedin':
        return 'https://www.linkedin.com/shareArticle?url=' + encodeURIComponent(href) + '&title=' + encodeURIComponent(title);
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

  // Function to convert a string to a URL-friendly slug
  function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  }

  // Get query parameters from URL
  function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split('&').forEach(param => {
      const [key, value] = param.split('=');
      params[key] = decodeURIComponent(value);
    });
    return params;
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
      return date.includes(query) || tags.includes(query);
    });
    renderPosts(filteredPosts);
  });
});
