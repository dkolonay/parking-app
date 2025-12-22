import "./Navbar.css";

const Navbar = ({ auth }) => {
  const handleLogin = (e) => {
    e.preventDefault()
    if (auth.isAuthenticated) {
      //handle logout
      auth.removeUser()
      const clientId = "6jpto601dlcn61dgf0uh7fsjel";
      const logoutUri = "https://easypark.cis4160.com";
    const cognitoDomain = "https://us-west-2b7f9fvkmx.auth.us-west-2.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    } else {
      auth.signinRedirect()
    }
  };

  return (
    <nav className={"navbar"}>
      <div className={"nav-container"}>
        <h1>EasyPark</h1>
        <button className={"login-link"} onClick={handleLogin}>{auth.isAuthenticated ? "Logout" : "Login"}</button>
      </div>
    </nav>
  );
};

export default Navbar;
