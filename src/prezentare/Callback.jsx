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
      // Trimite codul la backend pentru a obține token-ul
      fetch(`${RENDER_BACKEND_URL}/get-token`, {
        // AICI AM CORECTAT URL-UL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirect_uri: "https://melody-lab.netlify.app/callback",
        }),
      })
        .then((res) => {
          if (!res.ok) {
            // Dacă backend-ul răspunde cu eroare, aruncă o eroare
            return res.json().then((err) => {
              console.error("Eroare de la backend:", err);
              throw new Error(
                err.error || `Codul de stare HTTP nu a fost OK: ${res.status}`
              );
            });
          }
          return res.json();
        })
        .then((data) => {
          console.log("Token primit:", data);
          localStorage.setItem("spotifyAccessToken", data.access_token);
          localStorage.setItem("spotifyRefreshToken", data.refresh_token);
          navigate("/artisti");
        })
        .catch((err) => {
          console.error("Eroare la obținerea token-ului:", err);
          // Navighează la o pagină de eroare
          navigate("/error", {
            state: {
              message:
                "Eroare la obținerea token-ului de la backend. Verifică consola pentru detalii.",
            },
          });
        });
    } else {
      console.log(
        "Eroare la autentificare sau utilizatorul a refuzat permisiunile."
      );
      navigate("/error", {
        state: {
          message:
            "Conectarea a eșuat. Utilizatorul a refuzat permisiunile sau a apărut o eroare.",
        },
      });
    }
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mb-4"></div>
      <p className="text-xl">Se încarcă. Te rugăm să aștepți...</p>
    </div>
  );
}
