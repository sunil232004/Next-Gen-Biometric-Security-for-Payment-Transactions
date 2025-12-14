declare module 'react-qr-scanner' {
  import { Component } from 'react';

  export interface Props {
    delay?: number;
    style?: React.CSSProperties;
    onError(error: any): void;
    onScan(data: any): void;
    facingMode?: string;
    resolution?: number;
    chooseDeviceId?: () => string;
    constraints?: MediaTrackConstraints;
    legacyMode?: boolean;
  }

  export default class QrReader extends Component<Props, any> {}
}