'use client';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) },
  };
});

export function makeClient(serviceUrl: string) {
  const httpLink = createHttpLink({ uri: serviceUrl });
  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
}

export const authClient   = makeClient('http://localhost:3001/graphql');
export const vehicleClient = makeClient('http://localhost:3002/graphql');
export const trafficClient = makeClient('http://localhost:3003/graphql');
export const incidentClient = makeClient('http://localhost:3004/graphql');
export const notifClient   = makeClient('http://localhost:3005/graphql');
