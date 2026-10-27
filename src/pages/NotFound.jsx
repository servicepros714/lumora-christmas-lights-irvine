import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section flow-msg">
      <div className="container flow-msg__inner">
        <p className="eyebrow">Page not found</p>
        <h1 className="h2">This light seems to be <em>out.</em></h1>
        <p className="section-head__lede">The page you were looking for doesn't exist.</p>
        <Link to="/" className="btn btn--gold">Back to home</Link>
      </div>
    </section>
  );
}
