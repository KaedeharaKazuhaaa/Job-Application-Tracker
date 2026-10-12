import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CalendarCheck, CircleCheck } from "lucide-react";
import "./signup.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/toast-context";
import GoogleAuthButton from "./google-auth-button";

function Signup() {
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
        navigate('/signup', { replace: true });
    }, [location.search, navigate, toast]);

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to create your account.');
            toast('Account created successfully.', 'auth');
            setPassword('');
            navigate('/dashboard', { replace: true });
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Unable to connect to the server.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="signup-page">
            <aside className="signup-aside" aria-label="Jobora workspace">
                <Link className="signup-brand" to="/login">
                    <span className="signup-brand-mark"><img src="/jobora-mark.svg" alt="" /></span>
                    <span>
                        <strong>Jobora</strong>
                        <small>JOB SEARCH WORKSPACE</small>
                    </span>
                </Link>
                <div className="signup-aside-main">
                    <p className="signup-aside-eyebrow">A NEW CHAPTER</p>
                    <h2>Make room for what’s next.</h2>
                    <div className="signup-pipeline" aria-hidden="true">
                        <div className="signup-pipeline-step">
                            <span className="signup-pipeline-icon"><BriefcaseBusiness size={16} /></span>
                            <span>Applied</span>
                            <ArrowRight size={15} />
                        </div>
                        <div className="signup-pipeline-step">
                            <span className="signup-pipeline-icon"><CalendarCheck size={16} /></span>
                            <span>Interviewing</span>
                            <ArrowRight size={15} />
                        </div>
                        <div className="signup-pipeline-step">
                            <span className="signup-pipeline-icon"><CircleCheck size={16} /></span>
                            <span>Offer</span>
                        </div>
                    </div>
                </div>
                <p className="signup-aside-footer">YOUR NEXT MOVE, IN VIEW.</p>
            </aside>

            <section className="signup-content">
                <div className="signup-card">
                    <div className="signup-heading">
                        <p className="signup-heading-eyebrow">GET STARTED</p>
                        <h1>Create your account</h1>
                        <p>Set up your Jobora workspace.</p>
                    </div>
                    <GoogleAuthButton flow="signup" />
                <form className="signup-form" onSubmit={handleSignup}>
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
                    <button className="signup-button" type="submit" disabled={isSubmitting}>
                        <span>{isSubmitting ? 'Creating account...' : 'Create account'}</span>
                        {!isSubmitting && <ArrowRight size={17} />}
                    </button>
                </form>
                  <p className="signup-prompt">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
                </div>
            </section>
        </main>
    );
}
export default Signup;
