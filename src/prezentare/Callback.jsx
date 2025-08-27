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

      // 👇 1. CORECTEAZĂ URL-UL CU ENDPOINT-UL CORECT
      fetch("https://sortify-zucb.onrender.com/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirect_uri: "https://melody-lab.netlify.app/callback",
        }),
      })
        // 👇 2. ADAUGĂ VERIFICAREA PENTRU ERORI
        .then((res) => {
          if (!res.ok) {
            // Dacă răspunsul de la server este o eroare (4xx, 5xx)
            throw new Error(`Eroare de la server: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          // 3. SALVEAZĂ TOKEN-URILE (și refresh token, dacă este cazul)
          localStorage.setItem("spotifyAccessToken", data.access_token);
          // Dacă backend-ul întoarce și un refresh_token, salvează-l și pe acela
          if (data.refresh_token) {
            localStorage.setItem("spotifyRefreshToken", data.refresh_token);
          }
          console.log("Token salvat cu succes!");
          navigate("/artisti"); // Navighează către pagina principală
        })
        .catch((err) => {
          // 4. GESTIONEAZĂ ERORILE MAI BINE
          console.error("Eroare la obținerea token-ului:", err);
          // Navighează într-o pagină de eroare sau afișează un mesaj
          navigate("/error", {
            state: { message: "Conectarea la Spotify a eșuat." },
          });
        });
    } else {
      // 5. GESTIONEAZĂ CAZUL CÂND NU EXISTĂ COD ÎN URL
      console.error("Eroare: Nu s-a primit codul de la Spotify.");
      navigate("/error", {
        state: { message: "Nu s-a primit aprobarea de la Spotify." },
      });
    }
  }, [location, navigate]); // 👈 6. ADAUGĂ location și navigate ca dependencies

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p>Se încarcă...</p>
    </div>
  );
}
