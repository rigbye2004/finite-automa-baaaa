import { withBase } from '../withBase'
import './SheepPalette.css'

const ALL_SHEEP = [
  { id: 'sheep-1', src: withBase('sheep-assets/sheep-1.svg'), name: 'Sheep 1' },
  { id: 'sheep-2', src: withBase('sheep-assets/sheep-2.svg'), name: 'Sheep 2' },
  { id: 'sheep-3', src: withBase('sheep-assets/sheep-3.svg'), name: 'Sheep 3' },
  { id: 'sheep-4', src: withBase('sheep-assets/sheep-4.svg'), name: 'Sheep 4' },
  { id: 'sheep-5', src: withBase('sheep-assets/sheep-5.svg'), name: 'Sheep 5' },
  { id: 'sheep-6', src: withBase('sheep-assets/sheep-6.svg'), name: 'Sheep 6' },
  { id: 'sheep-7', src: withBase('sheep-assets/sheep-7.svg'), name: 'Sheep 7' },
  { id: 'sheep-8', src: withBase('sheep-assets/sheep-8.svg'), name: 'Sheep 8' },
  { id: 'sheep-9', src: withBase('sheep-assets/sheep-9.svg'), name: 'Sheep 9' },
  { id: 'sheep-10', src: withBase('sheep-assets/sheep-10.svg'), name: 'Sheep 10' },
  { id: 'sheep-11', src: withBase('sheep-assets/sheep-11.svg'), name: 'Sheep 11' },
  { id: 'sheep-12', src: withBase('sheep-assets/sheep-12.svg'), name: 'Sheep 12' },
  { id: 'sheep-13', src: withBase('sheep-assets/sheep-13.svg'), name: 'Sheep 13' },
  { id: 'sheep-14', src: withBase('sheep-assets/sheep-14.svg'), name: 'Sheep 14' },
  { id: 'sheep-15', src: withBase('sheep-assets/sheep-15.svg'), name: 'Sheep 15' },
  { id: 'sheep-16', src: withBase('sheep-assets/sheep-16.svg'), name: 'Sheep 16' },
]

interface SheepPaletteProps {
  onSelectSheep: (sheepId: string) => void
  selectedSheep?: string | null
  availableSheep?: string[]
}

export default function SheepPalette({ onSelectSheep, selectedSheep, availableSheep }: SheepPaletteProps) {
  const sheepToShow = availableSheep 
    ? ALL_SHEEP.filter(s => availableSheep.includes(s.id))
    : ALL_SHEEP.filter(s => ['sheep-3', 'sheep-7', 'sheep-8', 'sheep-13', 'sheep-16'].includes(s.id))

  return (
    <div className="sheep-palette">
      {sheepToShow.map((sheep) => (
        <button
          key={sheep.id}
          className={`sheep-btn ${selectedSheep === sheep.id ? 'selected' : ''}`}
          onClick={() => onSelectSheep(sheep.id)}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/sheep', sheep.id)}
          title={sheep.name}
        >
          <img
            src={sheep.src}
            alt={sheep.name}
            className="sheep-img sheep-idle"
          />
        </button>
      ))}
    </div>
  )
}
