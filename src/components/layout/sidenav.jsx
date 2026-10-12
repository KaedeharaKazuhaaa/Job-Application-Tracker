import { BriefcaseBusiness, LayoutDashboard, X } from "lucide-react";
import { Link } from "react-router-dom";
import "./sidenav.css";

function SideNav({ isOpen, activePath, onClose }) {
	return (
		<aside className={`side-nav${isOpen ? " is-open" : ""}`} aria-label="Main navigation">
			<div className="side-nav-brand">
				<span className="side-nav-mark" aria-hidden="true">
					<img src="/jobora-mark.svg" alt="" />
				</span>
				<span className="side-nav-brand-copy">
					<strong>Jobora</strong>
					<small>JOB SEARCH WORKSPACE</small>
				</span>
				<button className="side-nav-close" type="button" onClick={onClose} aria-label="Close navigation">
					<X size={20} />
				</button>
			</div>

			<div className="side-nav-section-label">WORKSPACE</div>
			<nav className="side-nav-links">
				<Link className={activePath === "/dashboard" ? "active" : ""} to="/dashboard" onClick={onClose}>
					<LayoutDashboard size={19} />
					<span>Overview</span>
				</Link>
				<Link className={activePath === "/applications" ? "active" : ""} to="/applications" onClick={onClose}>
					<BriefcaseBusiness size={19} />
					<span>Applications</span>
				</Link>
			</nav>

			<div className="side-nav-spacer" />
		</aside>
	);
}

export default SideNav;
