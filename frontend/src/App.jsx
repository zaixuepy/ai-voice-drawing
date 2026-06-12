import { Route, Switch } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import AppPage from './pages/AppPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/app" component={AppPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}
