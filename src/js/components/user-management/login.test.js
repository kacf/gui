import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import renderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Login from './login';

const mockStore = configureStore([]);
const store = mockStore({
  app: { features: { isHosted: false } },
  users: {
    byId: {},
    currentUser: null,
    globalSettings: {},
    onboarding: {
      complete: false,
      showTips: false
    },
    showHelptips: false
  }
});
store.dispatch = jest.fn();

it('renders correctly', () => {
  const tree = renderer
    .create(
      <MemoryRouter>
        <Provider store={store}>
          <Login location={{ state: { from: '' } }} />
        </Provider>
      </MemoryRouter>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
