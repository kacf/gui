import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import SharedSnackbar from './sharedsnackbar';
import { defaultState, undefineds } from '../../../../tests/mockData';

const mockStore = configureStore([thunk]);

describe('SharedSnackbar Component', () => {
  let store;
  beforeEach(() => {
    store = mockStore({ ...defaultState });
  });

  it('renders correctly', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <SharedSnackbar snackbar={{ maxWidth: 200, message: 'test' }} setSnackbar={jest.fn} />
      </Provider>
    );
    const view = baseElement.firstChild.firstChild;
    expect(view).toMatchSnapshot();
    expect(view).toEqual(expect.not.stringMatching(undefineds));
  });

  it('works as intended', async () => {
    const actionCheck = jest.fn();
    const copyCheck = jest.fn(() => true);
    document.execCommand = copyCheck;

    render(<SharedSnackbar snackbar={{ maxWidth: 200, open: true, message: 'test' }} setSnackbar={actionCheck} />);
    expect(screen.queryByText(/test/i)).toBeInTheDocument();
    userEvent.click(screen.getByText(/test/i));
    expect(actionCheck).toHaveBeenCalled();
    expect(copyCheck).toHaveBeenCalled();
  });

  it('works as intended with a click listener', async () => {
    const actionCheck = jest.fn();
    const copyCheck = jest.fn(() => true);
    const onClickCheck = jest.fn();
    document.execCommand = copyCheck;

    render(<SharedSnackbar snackbar={{ maxWidth: 200, open: true, message: 'test', onClick: onClickCheck }} setSnackbar={actionCheck} />);
    userEvent.click(screen.getByText(/test/i));
    expect(actionCheck).not.toHaveBeenCalled();
    expect(copyCheck).not.toHaveBeenCalled();
    expect(onClickCheck).toHaveBeenCalled();
  });
});
