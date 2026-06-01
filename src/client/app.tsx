import { h } from 'preact';
import Router from 'preact-router';
import { Landing } from './pages/Landing';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';

export function App() {
  return (
    <div class="app">
      <Navigation />
      <main>
        <Router>
          <Landing path="/" />
        </Router>
      </main>
      <Footer />
    </div>
  );
}
