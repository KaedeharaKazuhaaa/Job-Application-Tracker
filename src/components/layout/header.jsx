import { LogOut, Menu } from "lucide-react";
import "./header.css";

function Header({ email, onMenuClick, onLogout }) {
	return (
		<header className="dashboard-header">
			<button className="dashboard-menu-button" type="button" onClick={onMenuClick} aria-label="Open navigation">
				<Menu size={21} />
			</button>
			<div className="dashboard-header-spacer" />
			<div className="dashboard-header-user">
				<span className="dashboard-header-avatar" aria-hidden="true">{email?.[0]?.toUpperCase() || "U"}</span>
				<span className="dashboard-header-email">{email}</span>
				<span className="dashboard-header-separator" aria-hidden="true" />
				<button className="dashboard-header-logout" type="button" onClick={onLogout} aria-label="Sign out" title="Sign out">
					<LogOut size={18} />
				</button>
			</div>
		</header>
	);
}

export default Header;
