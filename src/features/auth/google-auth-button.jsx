import "./google-auth-button.css";

function GoogleAuthButton({ flow }) {
  return (
    <div className="auth-provider">
      <a className="google-auth-button" href={`/api/auth/google?flow=${flow}`}>
        <span className="google-auth-mark" aria-hidden="true">G</span>
        <span>Continue with Google</span>
      </a>
      <div className="auth-method-divider" aria-hidden="true">
        <span>or use email</span>
      </div>
    </div>
  );
}

export default GoogleAuthButton;
