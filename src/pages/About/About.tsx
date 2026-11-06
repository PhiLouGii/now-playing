import {
  ArrowDown,
  ArrowUpRight,
  AudioLines,
  Disc3,
  Headphones,
  Heart,
  Layers3,
  Mail,
  Radio,
  Send,
  Sparkles,
  Terminal,
} from 'lucide-react'

import { useState, type FormEvent } from 'react'
import './About.css'


const faqs = [
  {
    question: 'What is Now Playing?',
    answer:
      'Now Playing is a music guessing game built around recognising songs. Choose a category, listen to the music, and see how well you know your favourite tracks.',
  },
  {
    question: 'What game modes are available?',
    answer:
      'You can currently play by artist, era, genre and theme. There is also Pixel Cover, a visual guessing mode where you identify an album cover as it is revealed.',
  },
  {
    question: 'How does Pixel Cover work?',
    answer:
      'Pixel Cover challenges you to recognise an album through a pixelated image. The aim is to identify the cover as early as possible.',
  },
  {
    question: 'Are more game modes coming?',
    answer:
      'Absolutely. Movie & TV Soundtracks is planned for a later phase, alongside other ideas for expanding the Now Playing experience.',
  },
  {
    question: 'Where does the music come from?',
    answer:
      'Now Playing uses music metadata and audio previews from Deezer. Track availability and preview access can vary.',
  },
  {
    question: 'Can I suggest a feature or report a problem?',
    answer:
      'Yes! Feedback is welcome. Use the contact link below to share suggestions, report issues or simply tell us what you think.',
  },
]

const roadmap = [
  {
    number: '01',
    title: 'The music arcade',
    description: 'Artist, Era, Genre and Theme game modes.',
    status: 'AVAILABLE',
    className: 'is-available',
  },
  {
    number: '02',
    title: 'Pixel Cover',
    description: 'Recognise the album through the pixels.',
    status: 'AVAILABLE',
    className: 'is-available',
  },
  {
    number: '03',
    title: 'Movie & TV Soundtracks',
    description: 'Recognise the songs behind your favourite scenes.',
    status: 'COMING SOON',
    className: 'is-upcoming',
  },
  {
    number: '04',
    title: 'More ways to play',
    description: 'New challenges, categories and ways to test your music knowledge.',
    status: 'IN THE WORKS',
    className: 'is-planned',
  },
]

function About() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const [formStatus, setFormStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormStatus('submitting')

    try {
      const response = await fetch('https://formspree.io/f/meaadzzk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Something went wrong while sending your message.')
      }

      setFormStatus('success')
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
    } catch {
      setFormStatus('error')
    }
  }

  return (
    <main className="about-page">

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="about-hero">
        <div className="about-hero__topline">
          <span>NOW PLAYING / ABOUT</span>
          <span className="about-hero__edition">
            <AudioLines size={14} />
            THE STORY BEHIND THE SOUND
          </span>
        </div>

        <div className="about-hero__main">
          <div className="about-hero__copy">
            <p className="about-eyebrow">
              MORE THAN JUST A GUESSING GAME
            </p>

            <h1>
              Every song
              <br />
              tells a <span>story.</span>
            </h1>

            <p className="about-hero__description">
              Some songs take you back. Some you know after the
              first few notes. Others? Well, that's what we're
              here to find out.
            </p>

            <a href="#our-story" className="about-button">
              Get to know us
              <ArrowDown size={16} />
            </a>
          </div>

          <div className="about-hero__art">
            <div className="about-hero__art-label">
              <span>NOW PLAYING</span>
              <span>VOL. 001</span>
            </div>

            <div className="about-hero__record">
              <div className="about-hero__record-label">
                <AudioLines size={31} />
                <span>NP</span>
              </div>
            </div>

            <div className="about-hero__art-caption">
              <Disc3 size={15} />
              <span>PRESS PLAY. TRUST YOUR EARS.</span>
            </div>

            <span className="about-hero__decoration about-hero__decoration--one">
              ♪
            </span>
            <span className="about-hero__decoration about-hero__decoration--two">
              ♫
            </span>
          </div>
        </div>

        <div className="about-hero__footer">
          <span>AN INDEPENDENT MUSIC GAME</span>
          <span>MADE FOR THE LOVE OF MUSIC</span>
        </div>
      </section>

      {/* =====================================================
          OUR STORY
          ===================================================== */}

      <section className="about-section about-story" id="our-story">
        <div className="about-section__side">
          <span className="about-section__number">01 / THE STORY</span>
          <span className="about-section__side-note">
            IT STARTS WITH A SONG.
          </span>
        </div>

        <div className="about-story__content">
          <p className="about-eyebrow">HOW IT ALL STARTED</p>

          <h2>
            You know that feeling when you recognise a song
            <span> before anyone else?</span>
          </h2>

          <div className="about-story__columns">
            <p>
              That split second when the beat drops, a familiar
              melody starts playing, and suddenly you know
              exactly what song it is.
            </p>

            <p>
              Now Playing was created around that feeling.
              The idea is simple: turn music recognition into
              something playful, challenging and worth coming
              back to.
            </p>
          </div>

          <div className="about-story__quote">
            <span>THE IDEA</span>
            <p>
              How well do you really know the music you listen to?
            </p>
            <AudioLines size={25} />
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
          ===================================================== */}

      <section className="about-how">
        <div className="about-section__heading">
          <div>
            <p className="about-eyebrow">THE EXPERIENCE</p>
            <h2>Easy to get into. Hard to put down.</h2>
          </div>

          <span className="about-section__index">
            THE GAME, IN THREE STEPS
          </span>
        </div>

        <div className="about-how__grid">
          <article className="about-how-card">
            <span className="about-how-card__number">01</span>
            <div className="about-how-card__icon">
              <Layers3 size={23} />
            </div>
            <h3>Choose your game.</h3>
            <p>
              Pick an artist, decade, genre, theme or another
              available game mode.
            </p>
          </article>

          <article className="about-how-card">
            <span className="about-how-card__number">02</span>
            <div className="about-how-card__icon">
              <Headphones size={23} />
            </div>
            <h3>Listen closely.</h3>
            <p>
              Pay attention to the music, trust your memory
              and see what you recognise.
            </p>
          </article>

          <article className="about-how-card">
            <span className="about-how-card__number">03</span>
            <div className="about-how-card__icon">
              <Sparkles size={23} />
            </div>
            <h3>Make your guess.</h3>
            <p>
              Put your music knowledge to the test and see
              how you do.
            </p>
          </article>
        </div>
      </section>

      {/* =====================================================
          DEVELOPER
          ===================================================== */}

      <section className="about-section about-developer">
        <div className="about-section__side">
          <span className="about-section__number">02 / THE MAKER</span>
          <span className="about-section__side-note">
            BUILT WITH CURIOSITY.
          </span>
        </div>

        <div className="about-developer__content">
          <div className="about-developer__visual">
            <div className="about-developer__visual-inner">
              <Terminal size={42} strokeWidth={1.3} />
              <span>CREATIVE MODE: ON</span>
              <div className="about-developer__wave">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>

          <div className="about-developer__bio">
            <p className="about-eyebrow">MEET THE DEVELOPER</p>

            <h2>
              One developer.
              <br />
              A lot of <span>ideas.</span>
            </h2>

            <p>
              Hi, I'm Philippa a software engineer
              and creative developer who enjoys turning ideas
              into interactive experiences.
            </p>

            <p>
              Now Playing brings together two things I enjoy:
              building things and the little moments that make
              music memorable.
            </p>

            <p>
              It's an independent project built with curiosity,
              experimentation and a genuine love for creating.
            </p>

            <div className="about-developer__links">
              <a
                href="https://github.com/PhiLouGii"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
              >
                <Terminal size={17} />
                GitHub
                <ArrowUpRight size={14} />
              </a>

              <a
                href="mailto:pgiibwa04@gmail.com"
                aria-label="Email Philippa"
              >
                <Mail size={17} />
                Get in touch
                <ArrowUpRight size={14} />
              </a>
            </div>

            <p className="about-developer__link-note">
              Use the contact form below to send a message directly to the developer.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          MISSION & VISION
          ===================================================== */}

      <section className="about-mission">
        <div className="about-mission__heading">
          <p className="about-eyebrow">WHY WE PLAY</p>
          <h2>
            Music is better
            <br />
            <span>when it's shared.</span>
          </h2>
        </div>

        <div className="about-mission__cards">
          <article>
            <Heart size={22} />
            <span>OUR MISSION</span>
            <h3>Bring people closer through music.</h3>
            <p>
              Create an enjoyable space where music knowledge,
              discovery and friendly competition come together.
            </p>
          </article>

          <article>
            <Radio size={22} />
            <span>OUR VISION</span>
            <h3>A music arcade that keeps growing.</h3>
            <p>
              Keep exploring new ways to play, discover music
              and challenge yourself, one round at a time.
            </p>
          </article>
        </div>
      </section>

      {/* =====================================================
          ROADMAP
          ===================================================== */}

      <section className="about-section about-roadmap">
        <div className="about-section__heading">
          <div>
            <p className="about-eyebrow">WHAT'S NEXT?</p>
            <h2>The next tracks on our playlist.</h2>
            <p>
              Now Playing is an ongoing project. Here's a glimpse
              at what is available and what we're exploring next.
            </p>
          </div>

          <span className="about-section__index">
            THE ROAD AHEAD
          </span>
        </div>

        <div className="about-roadmap__list">
          {roadmap.map((item) => (
            <article
              className={`about-roadmap__item ${item.className}`}
              key={item.number}
            >
              <span className="about-roadmap__number">
                {item.number}
              </span>

              <div className="about-roadmap__details">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>

              <span className="about-roadmap__status">
                {item.status}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* =====================================================
          FAQ
          ===================================================== */}

      <section className="about-section about-faq">
        <div className="about-faq__intro">
          <p className="about-eyebrow">A FEW THINGS YOU MIGHT WONDER</p>
          <h2>Good questions.</h2>
          <p>
            New to Now Playing? Here's a little help getting started.
          </p>
        </div>

        <div className="about-faq__list">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index

            return (
              <article
                className={`about-faq__item ${isOpen ? 'is-open' : ''}`}
                key={faq.question}
              >
                <button
                  type="button"
                  className="about-faq__question"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <span>
                    <small>0{index + 1}</small>
                    {faq.question}
                  </span>

                  <span className="about-faq__toggle">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className="about-faq__answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {/* =====================================================
          CREDITS
          ===================================================== */}

      <section className="about-credits">
        <div className="about-credits__heading">
          <Disc3 size={23} />
          <div>
            <p className="about-eyebrow">THE LINER NOTES</p>
            <h2>Made possible by good music and good tools.</h2>
          </div>
        </div>

        <div className="about-credits__grid">
          <div>
            <span>DEVELOPMENT</span>
            <p>React · TypeScript · Vite</p>
          </div>

          <div>
            <span>MUSIC DATA & PREVIEWS</span>
            <p>Deezer, Last.fm</p>
          </div>

          <div>
            <span>BACKEND & DATA</span>
            <p>Firebase</p>
          </div>

          <div>
            <span>ICONS</span>
            <p>Lucide</p>
          </div>
        </div>

        <p className="about-credits__note">
          Music, artist names and related metadata belong to their
          respective owners. Now Playing is an independent project.
        </p>
      </section>

      {/* =====================================================
          CONTACT / CLOSING
          ===================================================== */}

      <section className="about-closing" id="contact">
  <div className="about-closing__record">
    <Disc3 size={46} strokeWidth={1.1} />
  </div>

  <p className="about-eyebrow">THAT'S OUR STORY. WHAT'S YOURS?</p>

  <h2>
    Got something
    <br />
    <span>to say?</span>
  </h2>

  <p>
    Have an idea, spotted something that needs fixing,
    or just want to talk music? We'd love to hear from you.
  </p>

  <form className="about-contact-form" onSubmit={handleContactSubmit}>
    <div className="about-contact-form__row">
      <label>
        Your name
        <input
          type="text"
          name="name"
          placeholder="What should we call you?"
          value={formData.name}
          onChange={(event) =>
            setFormData({ ...formData, name: event.target.value })
          }
          required
        />
      </label>

      <label>
        Email address
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(event) =>
            setFormData({ ...formData, email: event.target.value })
          }
          required
        />
      </label>
    </div>

    <label>
      Subject <span>(optional)</span>
      <input
        type="text"
        name="subject"
        placeholder="What's this about?"
        value={formData.subject}
        onChange={(event) =>
          setFormData({ ...formData, subject: event.target.value })
        }
      />
    </label>

    <label>
      Your message
      <textarea
        name="message"
        placeholder="Tell us what's on your mind..."
        rows={5}
        value={formData.message}
        onChange={(event) =>
          setFormData({ ...formData, message: event.target.value })
        }
        required
      />
    </label>

    <button
      type="submit"
      className="about-button about-button--light about-contact-form__submit"
      disabled={formStatus === 'submitting'}
    >
      {formStatus === 'submitting'
        ? 'Sending...'
        : 'Send message'}

      <Send size={16} />
    </button>

    {formStatus === 'success' && (
      <p className="about-contact-form__feedback is-success" role="status">
        Message sent! Thanks for getting in touch. We'll be in touch soon.
      </p>
    )}

    {formStatus === 'error' && (
      <p className="about-contact-form__feedback is-error" role="alert">
        We couldn't send your message. Please try again in a moment.
      </p>
    )}
  </form>

  <span className="about-closing__footer">
    NOW PLAYING · INDEPENDENTLY MADE
  </span>
</section>

    </main>
  )
}

export default About
