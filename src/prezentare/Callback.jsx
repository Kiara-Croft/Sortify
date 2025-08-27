import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function Callback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (code) {
      console.log("Code primit de la Spotify:", code);

      fetch("http://localhost:8888/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirect_uri: "https://melody-lab.netlify.app/callback",
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("spotifyAccessToken", data.access_token);
          navigate("/artisti");
        })
        .catch((err) => console.log(err));
    } else {
      console.log("Eroare sau user a refuzat permisiunile");
    }
  }, []);

  return <div>Se încarcă...</div>;
}
