import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="navbar">
    <a class="brand" href="#">ORBIT<span>ONE</span></a>

    <nav>
      <a href="#about">About</a>
      <a href="#missions">Missions</a>
      <a href="#community">Community</a>
    </nav>

    <button class="login-btn">Sign In</button>
  </header>

  <main>
    <section class="hero">
      <div class="hero-content">
        <p class="eyebrow">A MULTIPLAYER SPACE EXPERIENCE</p>

        <h1>EXPLORE<br>BEYOND<br><span>THE UNKNOWN.</span></h1>

        <p class="description">
          Explore space, take on missions and work together
          with players across the universe.
        </p>

        <div class="actions">
          <button id="play-button" class="play-btn">
            ENTER THE UNIVERSE →
          </button>
          <a href="#about" class="learn-btn">Discover more ↓</a>
        </div>
      </div>

      <div class="space-visual">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <div class="planet"></div>
        <div class="visual-label">UNKNOWN SECTOR // 001</div>
      </div>
    </section>

    <section id="about" class="info">
      <p>ONE UNIVERSE. MANY EXPLORERS.</p>
      <h2>Your mission begins here.</h2>
      <p>
        Join other explorers, discover new environments
        and complete challenges together.
      </p>
    </section>
  </main>

  <footer id="community">
    ORBITONE — EXPLORE TOGETHER.
  </footer>
`

document.querySelector<HTMLButtonElement>('#play-button')!
  .addEventListener('click', () => {
    alert('Multiplayer lobby coming soon!')
  })