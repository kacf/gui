import React from 'react';
import { connect } from 'react-redux';

import { getAllDevicesByStatus, getDeviceCount } from '../../actions/deviceActions';
import { setShowConnectingDialog } from '../../actions/userActions';
import { DEVICE_STATES } from '../../constants/deviceConstants';
import { onboardingSteps } from '../../constants/onboardingConstants';
import { getOnboardingState } from '../../selectors';
import { getOnboardingComponentFor } from '../../utils/onboardingmanager';
import AcceptedDevices from './widgets/accepteddevices';
import PendingDevices from './widgets/pendingdevices';
import RedirectionWidget from './widgets/redirectionwidget';

export class Devices extends React.Component {
  constructor(props, state) {
    super(props, state);
    const self = this;
    self.state = {
      deltaActivity: 0,
      loading: null
    };
  }

  handleResize() {
    setTimeout(() => {
      this.setState({ height: window.innerHeight, width: window.innerWidth });
    }, 500);
  }

  componentDidMount() {
    var self = this;
    // on render the store might not be updated so we resort to the API and let all later request go through the store
    // to be in sync with the rest of the UI
    self._refreshDevices();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  _refreshDevices() {
    if (this.state.loading || this.props.acceptedDevicesCount > this.props.deploymentDeviceLimit) {
      return;
    }
    this.props.getAllDevicesByStatus(DEVICE_STATES.accepted);
    this.props.getDeviceCount(DEVICE_STATES.pending);
    const deltaActivity = this._updateDeviceActivityHistory(this.props.activeDevicesCount);
    this.setState({ deltaActivity });
  }

  _updateDeviceActivityHistory(deviceCount) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();
    const jsonContent = window.localStorage.getItem('dailyDeviceActivityCount');
    let history = [];
    try {
      history = jsonContent ? JSON.parse(jsonContent) : [];
    } catch (error) {
      console.warn(error);
      window.localStorage.setItem('dailyDeviceActivityCount', JSON.stringify(history));
    }
    const yesterdaysDate = yesterday.toISOString().split('T')[0];
    const todaysDate = today.toISOString().split('T')[0];
    const result = history.reduce(
      (accu, item) => {
        if (item.date < yesterdaysDate) {
          accu.previousCount = item.count;
        }
        if (item.date === todaysDate) {
          accu.newDay = false;
        }
        return accu;
      },
      { previousCount: 0, newDay: true }
    );
    const previousCount = result.previousCount;
    if (result.newDay) {
      history.unshift({ count: deviceCount, date: todaysDate });
    }
    window.localStorage.setItem('dailyDeviceActivityCount', JSON.stringify(history.slice(0, 7)));
    return deviceCount - previousCount;
  }

  render() {
    const { deltaActivity } = this.state;
    const { acceptedDevicesCount, inactiveDevicesCount, onboardingState, pendingDevicesCount, setShowConnectingDialog, showHelptips } = this.props;
    const noDevicesAvailable = !(acceptedDevicesCount + pendingDevicesCount > 0);
    let onboardingComponent = null;
    if (this.anchor) {
      const element = this.anchor.children[this.anchor.children.length - 1];
      const anchor = { left: element.offsetLeft + element.offsetWidth / 2, top: element.offsetTop + element.offsetHeight - 50 };
      onboardingComponent = getOnboardingComponentFor(onboardingSteps.DASHBOARD_ONBOARDING_START, onboardingState, { anchor });
      if (this.pendingsRef) {
        const element = this.pendingsRef.wrappedElement.lastChild;
        const anchor = {
          left: this.pendingsRef.wrappedElement.offsetLeft + element.offsetWidth / 2,
          top: this.pendingsRef.wrappedElement.offsetTop + element.offsetHeight
        };
        onboardingComponent = getOnboardingComponentFor(onboardingSteps.DASHBOARD_ONBOARDING_PENDINGS, onboardingState, { anchor });
      }
    }
    return (
      <div>
        <h4 className="dashboard-header">
          <span>Devices</span>
        </h4>
        <div style={Object.assign({ marginBottom: 30 }, this.props.styles)} ref={element => (this.anchor = element)}>
          {!!pendingDevicesCount && (
            <PendingDevices
              pendingDevicesCount={pendingDevicesCount}
              isActive={pendingDevicesCount > 0}
              showHelptips={showHelptips}
              onClick={this.props.clickHandle}
              ref={ref => (this.pendingsRef = ref)}
            />
          )}
          <AcceptedDevices devicesCount={acceptedDevicesCount} inactiveCount={inactiveDevicesCount} delta={deltaActivity} onClick={this.props.clickHandle} />
          <RedirectionWidget
            target="/devices"
            content="Learn how to connect a device"
            buttonContent="Connect a device"
            onClick={() => setShowConnectingDialog(true)}
            isActive={noDevicesAvailable}
          />
        </div>
        {onboardingComponent ? onboardingComponent : null}
      </div>
    );
  }
}

const actionCreators = { getAllDevicesByStatus, getDeviceCount, setShowConnectingDialog };

const mapStateToProps = state => {
  return {
    activeDevicesCount: state.devices.byStatus.active.total,
    deploymentDeviceLimit: state.deployments.deploymentDeviceLimit,
    acceptedDevicesCount: state.devices.byStatus.accepted.total,
    inactiveDevicesCount: state.devices.byStatus.inactive.total,
    onboardingState: getOnboardingState(state),
    pendingDevicesCount: state.devices.byStatus.pending.total,
    showHelptips: state.users.showHelptips
  };
};

export default connect(mapStateToProps, actionCreators)(Devices);
