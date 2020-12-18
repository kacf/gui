import React from 'react';
import { render } from '@testing-library/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CardSection from './cardsection';
import { undefineds } from '../../../../tests/mockData';

describe('GlobalSettings Component', () => {
  let stripe;
  beforeEach(() => {
    jest.mock('@stripe/stripe-js', () => ({
      loadStripe: () => ({ createPaymentMethod: jest.fn() })
    }));
    stripe = loadStripe();
  });
  it('renders correctly', () => {
    const { baseElement } = render(
      <Elements stripe={stripe}>
        <CardSection isSignUp={true} />
      </Elements>
    );
    const view = baseElement.firstChild.firstChild;
    expect(view).toMatchSnapshot();
    expect(view).toEqual(expect.not.stringMatching(undefineds));
  });
});
