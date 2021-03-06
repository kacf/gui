import React from 'react';
import { Link } from 'react-router-dom';
import Time from 'react-time';

// material ui
import { Button, LinearProgress, TableCell, TableRow } from '@material-ui/core';

import { formatTime, statusToPercentage } from '../../../helpers';

const stateTitleMap = {
  noartifact: 'No compatible artifact found',
  'already-installed': 'Already installed'
};

const DeploymentDeviceListItem = ({ created, device, idAttribute, viewLog, retries }) => {
  var encodedDevice = `id=${device.id}`;
  var id_attribute = device.id || '-';

  if (idAttribute !== 'Device ID' && device.identity_data) {
    // if global setting is not "Device Id"
    // if device identity data is available, set custom attribute
    id_attribute = device.identity_data[idAttribute];
  }

  const softwareName = device.attributes['rootfs-image.version'] || device.attributes.artifact_name;
  const encodedArtifactName = encodeURIComponent(softwareName);
  const currentArtifactLink = softwareName ? (
    <Link style={{ fontWeight: '500' }} to={`/releases/${encodedArtifactName}`}>
      {softwareName}
    </Link>
  ) : (
    '-'
  );

  const status = stateTitleMap[device.status] || device.status;

  const intervalsSinceStart = Math.floor((Date.now() - Date.parse(created)) / (1000 * 20));
  const devicePercentage = statusToPercentage(device.status, intervalsSinceStart);
  const progressColor = status && (status.toLowerCase() === 'failure' || status.toLowerCase() === 'aborted') ? 'secondary' : 'primary';

  return (
    <TableRow>
      <TableCell>
        <Link style={{ fontWeight: '500' }} to={`/devices/${encodedDevice}`}>
          {id_attribute}
        </Link>
      </TableCell>
      <TableCell>{device.attributes.device_type || '-'}</TableCell>
      <TableCell>{currentArtifactLink}</TableCell>
      <TableCell>{device.created ? <Time value={formatTime(device.created)} format="YYYY-MM-DD HH:mm" /> : '-'}</TableCell>
      <TableCell>{device.finished ? <Time value={formatTime(device.finished)} format="YYYY-MM-DD HH:mm" /> : '-'}</TableCell>
      {retries ? (
        <TableCell>
          {device.attempts || 1}/{(device.retries || retries) + 1}
        </TableCell>
      ) : null}
      <TableCell style={{ paddingRight: '0px', position: 'relative', minWidth: 200 }}>
        {device.substate ? (
          <div className="flexbox">
            <div className="capitalized-start" style={{ verticalAlign: 'top' }}>{`${status}: `}</div>
            <div className="substate">{device.substate}</div>
          </div>
        ) : (
          status
        )}
        {!['pending', 'decommissioned', 'already-installed'].includes(device.status.toLowerCase()) && (
          <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
            <div style={{ textAlign: 'end', color: '#aaaaaa' }}>{`${devicePercentage}%`}</div>
            <LinearProgress color={progressColor} variant="determinate" value={devicePercentage} />
          </div>
        )}
      </TableCell>
      <TableCell>{device.log ? <Button onClick={() => viewLog(device.id)}>View log</Button> : null}</TableCell>
    </TableRow>
  );
};

export default DeploymentDeviceListItem;
