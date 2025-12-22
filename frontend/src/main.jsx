import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import "./index.css";
import App from "./App.jsx";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-west-2.amazonaws.com/us-west-2_b7F9fvKMX",
  client_id: "6jpto601dlcn61dgf0uh7fsjel",
  redirect_uri: "https://easypark.cis4160.com",
  response_type: "code",
  scope: "email openid phone",
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </StrictMode>
);
