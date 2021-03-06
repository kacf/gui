import React from 'react';
import { connect } from 'react-redux';
import pluralize from 'pluralize';

import RefreshIcon from '@material-ui/icons/Refresh';
import UpdateIcon from '@material-ui/icons/Update';

import { setSnackbar } from '../../actions/appActions';
import { getDeploymentsByStatus } from '../../actions/deploymentActions';
import { DEPLOYMENT_STATES } from '../../constants/deploymentConstants';
import { onboardingSteps } from '../../constants/onboardingConstants';
import { getOnboardingState } from '../../selectors';
import { clearAllRetryTimers, setRetryTimer } from '../../utils/retrytimer';
import { getOnboardingComponentFor } from '../../utils/onboardingmanager';
import Loader from '../common/loader';

import { BaseWidget } from './widgets/baseWidget';
import RedirectionWidget from './widgets/redirectionwidget';
import CompletedDeployments from './widgets/completeddeployments';

const refreshDeploymentsLength = 30000;

const iconStyles = {
  fontSize: 48,
  opacity: 0.5,
  marginRight: '30px'
};

const headerStyle = {
  alignItems: 'center',
  justifyContent: 'flex-end'
};

export class Deployments extends React.Component {
  constructor(props, state) {
    super(props, state);
    const self = this;
    self.timer = null;
    const lastDeploymentCheck = self.updateDeploymentCutoff(new Date());
    self.state = {
      lastDeploymentCheck,
      loading: true
    };
  }

  handleResize() {
    setTimeout(() => {
      this.setState({ height: window.innerHeight, width: window.innerWidth });
    }, 500);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    clearAllRetryTimers(this.props.setSnackbar);
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  componentDidMount() {
    var self = this;
    clearAllRetryTimers(self.props.setSnackbar);
    self.timer = setInterval(() => self.getDeployments(), refreshDeploymentsLength);
    self.getDeployments();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  getDeployments() {
    const self = this;
    const roundedStartDate = Math.round(Date.parse(self.state.lastDeploymentCheck) / 1000);
    const updateRequests = Object.keys(DEPLOYMENT_STATES)
      // we need to exclude the scheduled state here as the os version is not able to process these and will prevent the dashboard from loading
      .filter(status => status !== DEPLOYMENT_STATES.scheduled)
      .map(status => self.props.getDeploymentsByStatus(status, 1, 1, status === DEPLOYMENT_STATES.finished ? roundedStartDate : undefined));
    return Promise.all(updateRequests)
      .then(() => self.setState({ loading: false }))
      .catch(err => setRetryTimer(err, 'deployments', `Couldn't load deployments.`, refreshDeploymentsLength, self.props.setSnackbar));
  }

  updateDeploymentCutoff(today) {
    const jsonContent = window.localStorage.getItem('deploymentChecker');
    let lastCheck = today;
    try {
      lastCheck = jsonContent ? new Date(JSON.parse(jsonContent)) : today;
    } catch (error) {
      console.warn(error);
    }
    if (!window.sessionStorage.length) {
      window.localStorage.setItem('deploymentChecker', JSON.stringify(today));
      window.sessionStorage.setItem('sessionDeploymentChecker', JSON.stringify(today));
    }
    return lastCheck;
  }

  render() {
    const self = this;
    const { inprogressCount, pendingCount, finishedCount, onboardingState } = self.props;
    const { lastDeploymentCheck, loading } = self.state;

    const pendingWidgetMain = {
      counter: pendingCount,
      header: (
        <div className="flexbox" style={headerStyle}>
          <UpdateIcon className="flip-horizontal" style={iconStyles} />
          <div>Pending {pluralize('deployment', pendingCount)}</div>
        </div>
      ),
      targetLabel: 'View details'
    };
    const activeWidgetMain = {
      counter: inprogressCount,
      header: (
        <div className="flexbox" style={headerStyle}>
          <RefreshIcon className="flip-horizontal" style={iconStyles} />
          <div>{pluralize('Deployment', inprogressCount)} in progress</div>
        </div>
      ),
      targetLabel: 'View progress'
    };
    let onboardingComponent;
    if (this.deploymentsRef) {
      const anchor = {
        top: this.deploymentsRef.offsetTop + this.deploymentsRef.offsetHeight,
        left: this.deploymentsRef.offsetLeft + this.deploymentsRef.offsetWidth / 2
      };
      onboardingComponent = getOnboardingComponentFor(onboardingSteps.DEPLOYMENTS_PAST_COMPLETED, onboardingState, { anchor });
    }
    return (
      <div>
        <h4 className="dashboard-header">
          <span>Deployments</span>
        </h4>
        <div className="deployments" style={Object.assign({ marginBottom: 50 })}>
          {loading ? (
            <Loader show={loading} fade={true} />
          ) : (
            <div style={this.props.styles}>
              <BaseWidget
                className={inprogressCount ? 'current-widget active' : 'current-widget'}
                main={activeWidgetMain}
                onClick={() => self.props.clickHandle({ route: 'deployments/active' })}
              />
              <BaseWidget
                className={pendingCount ? 'current-widget pending' : 'current-widget'}
                main={pendingWidgetMain}
                onClick={() => self.props.clickHandle({ route: 'deployments/active' })}
              />
              <CompletedDeployments
                onClick={deploymentsTimeframe => self.props.clickHandle(deploymentsTimeframe)}
                finishedCount={finishedCount}
                cutoffDate={lastDeploymentCheck}
                innerRef={ref => (this.deploymentsRef = ref)}
              />
              <RedirectionWidget
                target="/deployments/active?open=true"
                content="Create a new deployment to update a group of devices"
                buttonContent="Create a deployment"
                onClick={() => this.props.clickHandle({ route: '/deployments/active?open=true' })}
                isActive={false}
              />
            </div>
          )}
          {onboardingComponent}
        </div>
      </div>
    );
  }
}

const actionCreators = { getDeploymentsByStatus, setSnackbar };

const mapStateToProps = state => {
  return {
    finishedCount: state.deployments.byStatus.finished.total,
    inprogressCount: state.deployments.byStatus.inprogress.total,
    onboardingState: getOnboardingState(state),
    pendingCount: state.deployments.byStatus.pending.total
  };
};

export default connect(mapStateToProps, actionCreators)(Deployments);
