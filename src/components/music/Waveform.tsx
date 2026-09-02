import './Waveform.css'

function Waveform() {
  return (
    <div className="waveform" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, index) => (
        <span
          key={index}
          className="waveform__bar"
          style={{
            animationDelay: `${index * 40}ms`,
          }}
        />
      ))}
    </div>
  )
}

export default Waveform