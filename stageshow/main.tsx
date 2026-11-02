import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Stage } from './vendor/kit/stage'
import { Camera } from './vendor/kit/motion/Camera'
import type { Act } from './vendor/kit/act'
import './scenes.css'

type Scene = { detail: boolean }
async function tour(a: Act<Scene>) {
  await a.wait(1600)
  a.mark('detail')
  a.put({ detail: true })
  await a.wait(5000)
  a.mark('overview')
  a.put({ detail: false })
  await a.wait(1800)
}

function ProductScene({ product }: { product: 'angrove' | 'invectus' }) {
  const [replay, setReplay] = useState(0)
  const research = product === 'invectus'
  return <>
    <Stage key={replay} width={1200} height={690} compact={{below: 640, width: 358, height: 400}}
      theme="dark" className={`portfolio-scene portfolio-scene--${product}`} play="once"
      initial={{detail: false}} poster={{detail: false}} script={tour}
      tokens={{'--ss-canvas': 'var(--bg)', '--ss-font': 'var(--font-body)', '--ss-accent': 'var(--mint)'}}>
      {(s, _rect, layout) => {
        const compact = layout === 'compact'
        const focus = compact ? null : research
          ? {x: 218, y: 228, width: 475, height: 370}
          : {x: 285, y: 360, width: 880, height: 275}
        return <Camera focus={s.detail ? focus : null} max={1.55} duration={1500} feather={0} pad={36}>
          <img className="portfolio-capture" src={research ? 'assets/img/invectus-gap.jpg' : 'assets/img/mac-boards-1.webp'}
            alt={research ? 'inVectus: a coverage gap with demand, coverage, and activity evidence beside a map of the research collection.' : 'Angrove for Mac: a Common Good study board, with a still life above two columns of notes.'}
            width={research ? 2000 : 2400} height={research ? 1300 : 1560} />
        </Camera>
      }}
    </Stage>
    <div className="scene-caption"><span className="small">{research ? 'Coverage gaps, with the evidence in view' : 'A place to think, and keep thinking'}</span>
      <button className="scene-replay" onClick={() => setReplay(v => v + 1)} aria-label={`Replay ${research ? 'inVectus' : 'Angrove'} detail tour`}>↻ <span>Replay detail</span></button>
    </div>
  </>
}

// The original capture stays visible if JavaScript or the enhancement fails.
for (const el of document.querySelectorAll<HTMLElement>('[data-product-scene]')) {
  const product = el.dataset.productScene as 'angrove' | 'invectus'
  createRoot(el).render(<ProductScene product={product} />)
}
