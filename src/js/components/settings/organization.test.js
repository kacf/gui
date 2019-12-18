import React from 'react';
import renderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MyOrganization from './organization';

const mockStore = configureStore([]);
const store = mockStore({
  app: {
    features: {
      isHosted: false
    }
  },
  users: {
    organization: {}
  }
});
store.dispatch = jest.fn();

it('renders correctly', () => {
  const tree = renderer
    .create(
      <Provider store={store}>
        <MyOrganization />
      </Provider>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
