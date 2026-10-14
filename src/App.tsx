import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, OrbitControls, Text } from '@react-three/drei'
import { createXRStore, XR, useXR } from '@react-three/xr'
import type { Mesh } from 'three'

// XRセッション管理ストアの作成
const store = createXRStore()

type Support = boolean | null

// ブラウザのWebXR対応状況を確認
function useXRSupport() {
  const [vr, setVR] = useState<Support>(null)
  const [ar, setAR] = useState<Support>(null)

  useEffect(() => {
    const xr = navigator.xr
    if (!xr) {
      setVR(false)
      setAR(false)
      return
    }
    xr.isSessionSupported('immersive-vr').then(setVR, () => setVR(false))
    xr.isSessionSupported('immersive-ar').then(setAR, () => setAR(false))
  }, [])

  return { vr, ar }
}

function label(s: Support) {
  if (s === null) return '確認中…'
  return s ? '✅ 対応' : '❌ 非対応'
}

// 回転し続けるキューブ(描画ループの確認用)
function SpinningBox() {
  const ref = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += delta * 0.5
    ref.current.rotation.y += delta
  })
  return (
    <mesh ref={ref} position={[0, 1.5, -2]}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}

// クリック/コントローラーのトリガーで色が変わる球(入力の確認用)
function ClickableSphere({ position }: { position: [number, number, number] }) {
  const [active, setActive] = useState(false)
  const [hovered, setHovered] = useState(false)
  return (
    <mesh
      position={position}
      scale={hovered ? 1.15 : 1}
      onClick={() => setActive((v) => !v)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial color={active ? 'limegreen' : 'royalblue'} />
    </mesh>
  )
}

// 現在のセッション状態を空間内に表示
function SessionInfo() {
  const mode = useXR((s) => s.mode)
  return (
    <Text position={[0, 2.2, -2]} fontSize={0.12} color="white" anchorX="center">
      {mode ? `XR mode: ${mode}` : 'XR mode: (not in session)'}
    </Text>
  )
}

export default function App() {
  const { vr, ar } = useXRSupport()

  return (
    <>
      {/* 対応状況とセッション開始ボタン */}
      <div className="xr-panel">
        <h1>WebXR テストページ</h1>
        <p>navigator.xr: {navigator.xr ? '✅ あり' : '❌ なし'}</p>
        <p>immersive-vr: {label(vr)}</p>
        <p>immersive-ar: {label(ar)}</p>
        <p>secure context: {window.isSecureContext ? '✅' : '❌ (HTTPSが必要)'}</p>
        <div className="xr-buttons">
          <button disabled={!vr} onClick={() => store.enterVR()}>Enter VR</button>
          <button disabled={!ar} onClick={() => store.enterAR()}>Enter AR</button>
        </div>
        <small>球をクリック/トリガーで色が変わります</small>
      </div>

      <Canvas camera={{ position: [0, 1.6, 1], fov: 60 }}>
        <XR store={store}>
          <color attach="background" args={['#202025']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} />

          <SpinningBox />
          <ClickableSphere position={[-0.6, 1.3, -1.5]} />
          <ClickableSphere position={[0.6, 1.3, -1.5]} />
          <SessionInfo />

          {/* 床のグリッド(トラッキング・スケール確認用) */}
          <Grid args={[10, 10]} cellColor="#555" sectionColor="#888" infiniteGrid fadeDistance={20} />

          <OrbitControls target={[0, 1.4, -2]} />
        </XR>
      </Canvas>
    </>
  )
}
