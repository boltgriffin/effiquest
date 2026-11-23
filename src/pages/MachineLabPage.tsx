import { useParams } from 'react-router-dom';
import { NotFoundState } from '@/components/StatePanels';
import { bicycleLab } from '@/features/lab/machines/bicycle';
import { brakeLab } from '@/features/lab/machines/brake';
import { hydraulicLab } from '@/features/lab/machines/hydraulic';
import { inclineLab } from '@/features/lab/machines/incline';
import { leverLab } from '@/features/lab/machines/lever';
import { pulleyLab } from '@/features/lab/machines/pulley';
import { screwLab } from '@/features/lab/machines/screw';
import { wedgeLab } from '@/features/lab/machines/wedge';
import { wheelAxleLab } from '@/features/lab/machines/wheelAxle';
import { MachineLab } from '@/features/lab/shared/MachineLab';

/** /lab/:machineId: one shared template, one definition per approved machine (D-05). */
export default function MachineLabPage() {
  const { machineId } = useParams();
  // `key` resets all lab state when switching machines.
  switch (machineId) {
    case 'incline':
      return <MachineLab key="incline" def={inclineLab} />;
    case 'lever':
      return <MachineLab key="lever" def={leverLab} />;
    case 'pulley':
      return <MachineLab key="pulley" def={pulleyLab} />;
    case 'wheel-and-axle':
      return <MachineLab key="wheel" def={wheelAxleLab} />;
    case 'hydraulic-press':
      return <MachineLab key="hydraulic" def={hydraulicLab} />;
    case 'screw':
      return <MachineLab key="screw" def={screwLab} />;
    case 'wedge':
      return <MachineLab key="wedge" def={wedgeLab} />;
    case 'bicycle':
      return <MachineLab key="bicycle" def={bicycleLab} />;
    case 'hydraulic-brake':
      return <MachineLab key="brake" def={brakeLab} />;
    default:
      return <NotFoundState />;
  }
}
