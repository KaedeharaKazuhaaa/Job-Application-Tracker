import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CalendarCheck, CircleCheck } from "lucide-react";
import "./login.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/toast-context";
import GoogleAuthButton from "./google-auth-button";
function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const handledOAuthError = useRef(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const oauthError = new URLSearchParams(location.search).get('oauthError');
        if (!oauthError || handledOAuthError.current) return;

        handledOAuthError.current = true;
        const messages = {
            configuration: "Google sign-in isn't configured yet. Add your Google OAuth credentials to backend/.env.",
            cancelled: "Google sign-in was cancelled.",
            unverified: "Google must verify your email address before you can continue.",
            state: "Google sign-in expired. Please try again.",
            account: "This Google account can't be linked to the existing account.",
        };
        toast(messages[oauthError] || "Google sign-in failed. Please try again.", 'error');
        navigate('/login', { replace: true });
    }, [location.search, navigate, toast]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to log in.');
            toast('Welcome back.', 'auth');
            setPassword('');
            navigate('/dashboard', { replace: true });
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Unable to connect to the server.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="login-page">
            <aside className="login-aside" aria-label="Jobora workspace">
                <Link className="login-brand" to="/signup">
                    <span className="login-brand-mark"><img src="/jobora-mark.svg" alt="" /></span>
                    <span>
                        <strong>Jobora</strong>
                        <small>JOB SEARCH WORKSPACE</small>
                    </span>
                </Link>
                <div className="login-aside-main">
                    <p className="login-aside-eyebrow">YOUR NEXT MOVE</p>
                    <h2>Good to have you back.</h2>
                    <div className="login-pipeline" aria-hidden="true">
                        <div className="login-pipeline-step">
                            <span className="login-pipeline-icon"><BriefcaseBusiness size={16} /></span>
                            <span>Applications</span>
                            <ArrowRight size={15} />
                        </div>
                        <div className="login-pipeline-step">
                            <span className="login-pipeline-icon"><CalendarCheck size={16} /></span>
                            <span>Interviews</span>
                            <ArrowRight size={15} />
                        </div>
                        <div className="login-pipeline-step">
                            <span className="login-pipeline-icon"><CircleCheck size={16} /></span>
                            <span>Offers</span>
                        </div>
                    </div>
                </div>
                <p className="login-aside-footer">YOUR SEARCH, IN ONE PLACE.</p>
            </aside>

            <section className="login-content">
                <div className="login-card">
                    <div className="login-heading">
                        <p className="login-heading-eyebrow">WELCOME BACK</p>
                        <h1>Sign in to Jobora</h1>
                        <p>Pick up where your job search left off.</p>
                    </div>
                    <GoogleAuthButton flow="login" />
                <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            minLength={8}
                            maxLength={72}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button className="login-button" type="submit" disabled={isSubmitting}>
                        <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
                        {!isSubmitting && <ArrowRight size={17} />}
                    </button>
                </form>
                <p className="signup-prompt">
                    New to Jobora? <Link to="/signup">Create an account</Link>
                </p>
                </div>
            </section>
        </main>
    );
}
export default Login;