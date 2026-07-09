// user_context.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDocFromServer, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, onValue, onDisconnect, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { auth, db, rtdb } from './firebase';

const UserContext = createContext(null);

// Kada ganitong dami ng millisegundo, ire-refresh ng may-aktibong session
// ang `lastActiveAt` niya sa Firestore — ito ang "heartbeat" na ginagamit
// ng student_login.jsx/faculty_login.jsx para malaman kung "fresh" (aktibong
// ginagamit) o "stale" (na-close ang browser nang hindi nag-logout) na ang
// isang naka-claim nang session.
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    // restore from localStorage on first load
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // ── Auth-confirmed user (source of truth para sa RTDB/Firestore writes) ──
  // Iba ito sa `user` sa itaas — yung `user` ay pwedeng galing pa lang sa
  // localStorage restore (optimistic UI, para hindi mag-flash ng "logged out"
  // state habang naglo-load). Ang `firebaseUser` dito ay direktang mula sa
  // `onAuthStateChanged`, kaya sigurado tayong may TUNAY at KASALUKUYANG
  // authenticated session bago tayo magsulat kahit saan (RTDB status node,
  // Firestore heartbeat, etc.) — kailangan ito ng RTDB rules natin na
  // umaasa sa `auth != null` / `auth.uid === $uid`.
  const [firebaseUser, setFirebaseUser] = useState(null);

  // ── Logout intent flag ──
  // Kapag nag-signOut(), pwedeng mag-reconnect muna ang RTDB socket (kasi
  // nagbabago ang auth token) BAGO pa man dumating ang onAuthStateChanged
  // callback na magse-set ng firebaseUser sa null. Pag nangyari yun,
  // maaaring ma-retrigger yung presence effect sa ibaba (.info/connected:
  // false → true ulit) at ma-overwrite pabalik sa "online" yung explicit
  // "offline" write na ginawa na ng logout handler. Ang ref na ito ang
  // gagamitin nating "sabi ko na, huwag ka nang sumulat ng online" na
  // sinusuri ng presence effect bago ito mag-set.
  const isLoggingOutRef = useRef(false);
  const beginLogout = () => {
    isLoggingOutRef.current = true;
  };

  // ── Session confirmation flag ──
  // Hindi na dapat awtomatikong sumulat ng "online" ang presence effect sa
  // ibaba sa sandaling lang may firebaseUser — kasi tumatakbo ito bago pa
  // man makumpleto ang session-lock check sa student_login.jsx/faculty
  // login, at posibleng mauna itong sumulat ng "online" bago pa mabasa ng
  // check, causing a false self-block (na-block ang sarili niyang session
  // dahil sa write na ginawa niya rin mismo). Hihintayin muna natin ang
  // explicit na confirmSession() call mula sa login page — matapos
  // ma-pass ang session-lock check — bago mag-mark ng "online".
  const isSessionConfirmedRef = useRef(false);
  const confirmSession = () => {
    isSessionConfirmedRef.current = true;
    // KRITIKAL: gamitin ang `auth.currentUser?.uid` dito, HINDI ang
    // `firebaseUser?.uid` (React state). Kapag tinawag ang confirmSession()
    // mula sa student_login.jsx/faculty login, ang closure na dala ng
    // function na yun ay pwedeng "stale" — nakuha ito bago pa man
    // matagumpay ang login (bago pa may firebaseUser sa React state), kaya
    // `null` pa ang makikita nitong firebaseUser kahit successful na ang
    // auth sa Firebase mismo. Ang `auth.currentUser` ay direktang mula sa
    // Firebase Auth SDK — laging up-to-date anumang oras ito basahin,
    // kaya hindi ito apektado ng stale React closures.
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const statusRef = ref(rtdb, `status/${uid}`);
    onDisconnect(statusRef)
      .set({ state: 'offline', lastChanged: rtdbServerTimestamp() })
      .then(() => {
        set(statusRef, { state: 'online', lastChanged: rtdbServerTimestamp() });
      });
  };

  // ── Data-ready flag ──
  // Hindi sapat na umasa lang sa `firebaseUser?.uid && user?.uid` para
  // malaman kung "handa na" ang session — ang `user` dito ay pwedeng
  // galing pa lang sa localStorage restore (agad na `true` sa unang mount,
  // kahit hindi pa natin na-cco-confirm sa Firestore mismo ngayong
  // session na ito). Kung papayagan nating tumakbo ang heartbeat effect
  // (sa ibaba) base lang dito, pwede itong makipag-race sa sarili nating
  // `getDoc()` sa itaas — ang `setDoc(..., {lastActiveAt: serverTimestamp()},
  // {merge:true})` ay may "pending/local" placeholder value (`null`) bago
  // pa ma-confirm ng server, kaya minsan nakikita ng kasabay na `getDoc()`
  // ang partial/pending na bersyon lang ng document (`{lastActiveAt:
  // null}` lang, kulang sa ibang fields) — ito yung dahilan kung bakit
  // paminsan-minsan nagiging "undefined undefined" ang pangalan
  // pagkatapos mag-refresh. Ang `dataReady` na ito ay `true` lang
  // matapos talagang matapos (buo, hindi pending) ang ating sariling
  // `getDoc()` sa itaas.
  const [dataReady, setDataReady] = useState(false);

  // ── Login-in-progress flag ──
  // Kapag nag-e-execute ang handleLogin() ng student_login.jsx/faculty
  // login (fresh sign-in), kasabay/kasunod nito ay ma-tri-trigger DIN ang
  // onAuthStateChanged sa ibaba — na may sarili niyang (redundant) Firestore
  // read + session-match check. Kung mangyari itong dalawa nang SABAY,
  // may tsansang mauna ang restore path na basahin ang Firestore BAGO pa
  // makumpleto ang `setDoc(activeSessionId)` mismo ng handleLogin() —
  // makikita niya yung LUMANG activeSessionId, ituturing itong "hindi
  // tugma", at maling ma-`setUser(null)` kaagad-agad pagkatapos mismong
  // mag-login (false logout). Ang flag na ito ang nagsasabi sa restore
  // path na "huwag ka munang gagawa ng kahit ano — may aktibong fresh
  // login flow na tumatakbo sa tab na ito, siya na ang bahala sa sarili
  // niyang setUser()/confirmSession() calls."
  const loginInProgressRef = useRef(false);
  const beginLogin = () => {
    loginInProgressRef.current = true;
  };
  const endLogin = () => {
    loginInProgressRef.current = false;
  };

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    setFirebaseUser(fbUser);

    // Habang may aktibong fresh login flow (beginLogin() ~ endLogin()) sa
    // tab na ito, huwag munang pakialaman ang `user`/`dataReady` state dito
    // — ang login page mismo ang direktang bahala. Ligtas na tumakbo ulit
    // ang normal na restore logic sa ibaba sa SUSUNOD na auth state change
    // (o sa susunod na refresh), kung saan tapos na at consistent na ang
    // Firestore write.
    if (loginInProgressRef.current) return;

    setDataReady(false);

    if (fbUser) {
      // Bagong auth state — i-reset ang logout flag kung meron man itong
      // natirang `true` mula sa nakaraang session. I-reset din ang
      // session-confirmed flag: dapat mag-confirmSession() muna ulit ang
      // login page bago tayo sumulat ng "online" para sa bagong session
      // na 'to.
      isLoggingOutRef.current = false;
      isSessionConfirmedRef.current = false;
      // KRITIKAL: gamitin ang `getDocFromServer()` dito, HINDI ang plain
      // `getDoc()` — sinisigurado nitong direkta tayong bumabasa mula sa
      // server (hindi sa local/offline cache), kaya hindi na tayo
      // apektado kahit anong "pending" na local mutation state mula sa
      // heartbeat effect (o mula sa nakaraang page load na hindi pa
      // na-sync, kung sobrang bilis ng spam-refresh). Mas mabagal ito nang
      // konti (totoong network round-trip palagi), pero garantisadong
      // buo at tumpak ang makukuhang data.
      let snap = await getDocFromServer(doc(db, 'faculty', fbUser.uid));
      if (!snap.exists()) {
        snap = await getDocFromServer(doc(db, 'students', fbUser.uid));
      }
      if (snap.exists()) {
        const userData = { uid: fbUser.uid, ...snap.data() };

        // ── Session-match gate ──
        // Bago natin ipakita ang tab na ito bilang "naka-login", tignan
        // muna natin kung ITO nga ang opisyal/kumpirmadong may-hawak ng
        // kasalukuyang aktibong session (`activeSessionId` sa Firestore).
        // Ang `sessionStorage` ay TAB-SCOPED (hindi ito nagshe-share sa
        // ibang tabs, kahit parehong browser at parehong shared Firebase
        // Auth session sila) — kaya kung wala pang laman ang
        // sessionStorage ng tab na ito (hal. bagong tab lang na binuksan,
        // hindi dumaan sa login page), o hindi na ito tugma (na-superseded
        // na ng ibang tab/device), ibig sabihin HINDI ito ang legit na
        // may-hawak ng session — kahit buhay pa ang shared Firebase Auth
        // session sa likod nito.
        const storedSessionId = sessionStorage.getItem('itfun_sessionId');
        const isConfirmedActiveSession = storedSessionId && storedSessionId === userData.activeSessionId;

        if (isConfirmedActiveSession) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));

          // ── Auto-reconfirm session pagkatapos mag-refresh ──
          // Dumadaan lang ang confirmSession() sa handleLogin() ng login
          // pages — pero pag nag-refresh ang isang naka-login nang tab,
          // dumadaan ito rito (onAuthStateChanged restore), hindi sa
          // handleLogin(). Kung walang gagawin dito, mananatiling "offline"
          // ang RTDB status pagkatapos mag-refresh (dahil na-disconnect
          // muna ang socket sa mismong reload), kahit legit at aktibo pa
          // ring session ito.
          confirmSession();
        } else {
          // HINDI ito ang legit na may-hawak ng session — huwag ipakita
          // bilang naka-login, kahit "may" firebaseUser (shared session)
          // tayo dito. HINDI natin tatawagin ang auth.signOut() dito
          // (mananatiling buhay ang shared session para sa totoong legit
          // na tab); sapat na ang hindi pagpakita ng `user` dito.
          setUser(null);
          localStorage.removeItem('user');
        }
      }

      // Tapos na tayong mag-attempt mag-getDoc() (buo man o hindi
      // nag-exist ang doc) — ligtas na ngayon para tumakbo ang heartbeat
      // effect sa ibaba nang walang katakot-takot na makipag-race pa sa
      // atin.
      setDataReady(true);
    } else {
      setUser(null);
      localStorage.removeItem('user');
    }
  });

  return () => unsubscribe();
}, []);

  // ── Session heartbeat ──
  // Habang naka-login (may `user`), regular na ire-refresh ang `lastActiveAt`
  // ng account niya sa Firestore. Ginagamit ito ng login pages para
  // malaman kung "fresh" pa (occupied) o "stale" na (pwede nang i-claim
  // ulit ng bagong login attempt) ang isang session — hal. kung na-close
  // lang ng dating user ang browser nang hindi nag-Logout.
  useEffect(() => {
    // Hintayin munang ma-confirm ng Firebase Auth mismo (hindi lang localStorage
    // restore) na may session bago tayo magsulat sa Firestore. Hintayin din
    // ang `dataReady` — kahit True na ang `firebaseUser?.uid` at `user?.uid`
    // (mula sa stale localStorage restore), huwag munang payagang tumakbo
    // ang heartbeat hangga't hindi pa tapos ang sarili nating getDoc() sa
    // itaas — para maiwasan ang race condition na dahilan ng "undefined
    // undefined" bug (ref: dataReady comment sa itaas).
    if (!firebaseUser?.uid || !user?.uid || !dataReady) return;

    const collectionName = user.role === 'faculty' ? 'faculty' : 'students';
    const sendHeartbeat = () => {
      setDoc(doc(db, collectionName, user.uid), {
        lastActiveAt: serverTimestamp(),
      }, { merge: true }).catch((err) => {
        console.error('Heartbeat update failed:', err);
      });
    };

    sendHeartbeat(); // agad mag-refresh sa unang mount, hindi hihintayin ang unang interval
    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [firebaseUser?.uid, user?.uid, user?.role, dataReady]);

  // ── Realtime presence (RTDB) ──
  // Hindi katulad ng Firestore heartbeat sa itaas (na umaasa sa client-side
  // JS na tumatakbo bawat 30s), ang presence system na ito ay
  // SERVER-AUTHORITATIVE: sinasabihan natin ang Firebase RTDB server mismo
  // kung ano ang gagawin niya "kapag naputol ang connection na ito" — kaya
  // gumagana ito kahit biglaang mawala ang internet/kuryente ng device
  // (brownout, crash, force-close), walang oras na kailangan ang client
  // para makapag-cleanup nang mag-isa.
  useEffect(() => {
    // KRITIKAL: gamitin ang `firebaseUser?.uid` (galing mismo sa
    // onAuthStateChanged) bilang gate — hindi ang `user?.uid` na pwedeng
    // galing pa lang sa localStorage restore. Kung ang huli ang gagamitin,
    // pwedeng mag-attempt tayong sumulat sa RTDB bago pa man ma-confirm ng
    // Firebase Auth mismo na may session (`auth.currentUser` ay `null` pa),
    // at ma-reject ng RTDB rules natin (PERMISSION_DENIED) dahil doon.
    if (!firebaseUser?.uid) return;

    const statusRef = ref(rtdb, `status/${firebaseUser.uid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snap) => {
      // `false` ang halaga nito habang papa-establish pa lang ang koneksyon
      // (o kapag talagang naputol) — walang gagawin dito, wala pa tayong
      // aktibong connection na pwedeng lagyan ng onDisconnect().
      if (snap.val() === false) return;

      // Kung kasalukuyang naglo-logout na (isLoggingOutRef.current === true),
      // huwag nang mag-set ulit ng "online" kahit mag-reconnect ang socket
      // dahil sa signOut() — dito nagkakaroon ng race condition na
      // na-o-overwrite pabalik yung explicit "offline" write ng logout
      // handler.
      if (isLoggingOutRef.current) return;

      // Hintayin muna ang explicit na confirmSession() mula sa login page
      // (matapos pumasa sa session-lock check) bago mag-auto-write ng
      // "online" dito. Kung hindi pa na-confirm, wala tayong gagawin —
      // ang confirmSession() mismo ang direktang susulat kapag tama na
      // ang oras.
      if (!isSessionConfirmedRef.current) return;

      // May aktibong koneksyon na ngayon papunta sa RTDB server. Ito ang
      // instruction na "iiwan" natin sa server: kapag naputol ang
      // partikular na connection na ito (anumang dahilan), i-set ang
      // status ko sa "offline". Ang server mismo ang magre-run nito, kaya
      // hindi na umaasa sa aming JavaScript.
      onDisconnect(statusRef)
        .set({
          state: 'offline',
          lastChanged: rtdbServerTimestamp(),
        })
        .then(() => {
          // Ngayon lang, matapos ma-set ang onDisconnect() sa server,
          // i-mamarkahan natin bilang "online" — sinisigurado nitong laging
          // may onDisconnect() instruction na naka-attach bago pa man
          // makita ng ibang device na "online" tayo.
          set(statusRef, {
            state: 'online',
            lastChanged: rtdbServerTimestamp(),
          });
        });
    });

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  // ── Real-time "kicked out" detector (same-browser multi-tab) ──
  // Ang lock check sa student_login.jsx/faculty_login.jsx ay CHECK-ON-LOGIN
  // lang — tinitignan lang niya kung may aktibong session sa MISMONG ORAS
  // ng pag-login. Wala pang mekanismo dati na "live" na nagre-react sa
  // panig ng LUMANG tab sa sandaling may BAGONG tab/device na mag-claim ng
  // session — kaya kung dalawang tab sa PAREHONG browser (na SHARED ang
  // Firebase Auth session sa pagitan nila), pareho silang nananatiling
  // "naka-login" sa UI kahit isa lang dapat ang totoong may-hawak.
  //
  // Dito, nakikinig tayo nang real-time sa `activeSessionId` field ng
  // Firestore doc ng account na ito. Kada beses na may bagong pag-login
  // (kahit sa ibang tab ng PAREHONG browser, o sa ibang device), nagbabago
  // ang value nito. Kung ang `activeSessionId` na ngayon ay HINDI na tugma
  // sa sessionId ng TAB NA ITO (naka-store sa sessionStorage, tab-scoped
  // kaya hindi ito nagshe-share sa ibang tabs), ibig sabihin na-"superseded"
  // na ang tab na ito — kailangan na nating tuluyan itong i-logout, kahit
  // hindi ito ni-refresh o ginalaw ng user.
  //
  // KRITIKAL: HINDI natin tinatawag ang `auth.signOut()` dito. Dahil SHARED
  // ang Firebase Auth session sa BUONG BROWSER (lahat ng tabs), kung
  // tatawagin natin ang signOut() dito, ma-lo-logout DIN nito yung
  // BAGONG/legit na tab (kung parehong browser sila) — mapapatalsik pati
  // yung dapat manatiling naka-login. Sapat na na i-clear natin ang LOCAL
  // React state ng tab na ito lang (`setUser(null)`, tanggalin sa
  // localStorage) at itulak papunta sa login page — ang totoong Firebase
  // Auth session mismo ay mananatiling buhay sa background para sa ibang
  // (legit) tab.
  useEffect(() => {
    if (!user?.uid || !user?.role) return;

    const collectionName = user.role === 'faculty' ? 'faculty' : 'students';
    const unsub = onSnapshot(doc(db, collectionName, user.uid), (snap) => {
      if (!snap.exists()) return;

      const myTabSessionId = sessionStorage.getItem('itfun_sessionId');
      // Kung wala pang naka-store na sessionId sa tab na ito (hal. hindi pa
      // ito ang nag-claim ng session sa una), huwag muna tayong gagawa ng
      // kahit ano dito — mali-mislead lang tayo. Ang tanging dapat mag-react
      // dito ay yung tab na TALAGANG naka-claim na dati ng sarili niyang
      // session (may sessionId na sa sessionStorage niya).
      if (!myTabSessionId) return;

      const currentActiveSessionId = snap.data().activeSessionId;
      if (currentActiveSessionId && currentActiveSessionId !== myTabSessionId) {
        sessionStorage.removeItem('itfun_sessionId');
        setUser(null);
        localStorage.removeItem('user');
        alert('You have been logged out because this account was used in another window or device.');
        window.location.href = '/';
      }
    });

    return () => unsub();
  }, [user?.uid, user?.role]);

  // ── ID token cache (para sa sendBeacon sa ibaba) ──
  // Hindi tayo pwedeng mag-await ng getIdToken() sa loob mismo ng
  // pagehide handler (baka hindi na ito umabot matapos ipatay ng browser
  // ang JS execution) — kaya dito na natin ito kinukuha nang maaga at
  // isino-store sa ref, laging handa sa sandaling kailanganin.
  const idTokenRef = useRef(null);
  useEffect(() => {
    if (!firebaseUser) {
      idTokenRef.current = null;
      return;
    }
    let cancelled = false;
    const refreshToken = () => {
      firebaseUser.getIdToken().then((token) => {
        if (!cancelled) idTokenRef.current = token;
      }).catch((err) => console.error('Failed to cache ID token for beacon:', err));
    };
    refreshToken();
    // ID tokens ay expired na pagkalipas ng 1 oras — i-refresh bawat 30
    // minuto para laging bago ang naka-cache.
    const intervalId = setInterval(refreshToken, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [firebaseUser]);

  // ── Maaasahang "offline" write sa tab/window close (via sendBeacon) ──
  // Ang onDisconnect() sa itaas ay SERVER-side na detection — tumpak at
  // gumagana kahit biglaang mawala ang koneksyon, pero hindi ito palaging
  // instant: ang Firebase RTDB server mismo ang nagpapasya kung kailan
  // "talagang naputol na" ang WebSocket, at maaari itong umabot ng ilang
  // segundo hanggang mas matagal pa bago ma-trigger. Sinubukan muna natin
  // ang direktang WebSocket `set()` sa `pagehide`, pero hindi ito
  // maaasahan — pinuputol na ng browser ang JS execution sa sandaling
  // isinasara ang tab, kaya madalas hindi pa naaabutang makumpleto ang
  // WebSocket round-trip.
  //
  // Ang `navigator.sendBeacon()` ay eksaktong ginawa para dito — isang
  // regular na HTTP request (hindi WebSocket) na GINAGARANTIYAHAN MISMO ng
  // browser na maipapadala kahit isinasara na ang tab. Dumadaan ito sa
  // backend (Railway) na siya namang gumagamit ng Firebase Admin SDK para
  // direktang mag-set ng "offline" — kaya hindi na umaasa sa client-side
  // WebSocket connection na baka maaga nang mamatay.
  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const markOfflineOnClose = () => {
      // Kung naglo-logout na (may explicit offline write na ang
      // handleConfirmLogout mismo), huwag nang doblehin dito.
      if (isLoggingOutRef.current) return;
      if (!idTokenRef.current) return;
      // KRITIKAL: kung HINDI ito ang kumpirmadong/legit na may-hawak ng
      // session (hal. isang "bogus" bagong tab na hindi naman kumpirmado
      // ng session-match gate sa restore path), huwag na tayong magpadala
      // ng "offline" beacon dito — baka ma-overwrite natin nang mali yung
      // totoong "online" status ng LEGIT na tab, kahit ito lang mismo yung
      // nagsasara.
      if (!isSessionConfirmedRef.current) return;

      const payload = JSON.stringify({
        uid: firebaseUser.uid,
        idToken: idTokenRef.current,
      });
      // TAMA na pala ito bilang plain string: kapag walang custom
      // Content-Type na itinakda (hal. sa pamamagitan ng Blob), default
      // itong "text/plain;charset=UTF-8" — isa 'to sa CORS-safelisted na
      // content types, kaya hindi ito nangangailangan ng preflight (OPTIONS)
      // request. Mahalaga ito dahil ang frontend (Vercel) at backend
      // (Railway) natin ay CROSS-ORIGIN, at ang `navigator.sendBeacon()`
      // ay HINDI kayang mag-preflight — kung "application/json" ang
      // Content-Type (hal. sa pamamagitan ng Blob na may ganitong type),
      // hindi ito CORS-safe at maaaring hindi umabot nang tama ang
      // request. Ang backend (`/api/set-offline` sa server.js) ay
      // sadyang dinisenyo para tanggapin ito bilang raw text
      // (`express.text({ type: '*/*' })`) at mismo itong nag-JSON.parse()
      // sa body — kaya tama na ang plain string dito, hindi na kailangan
      // pang i-Blob/i-type explicitly.
      const sent = navigator.sendBeacon(
        `${import.meta.env.VITE_BACKEND_URL}/api/set-offline`,
        payload
      );
      // TEMPORARY DEBUG LOG — tanggalin na natin 'to kapag nakumpirma na
      // gumagana. Kung `false` ang ibalik nito, ibig sabihin tinanggihan
      // agad ng browser yung request mismo (hal. mali/undefined ang
      // VITE_BACKEND_URL, o masyadong malaki ang payload) — hindi man
      // lang ito umabot sa network. I-check ito gamit ang "Preserve log"
      // sa DevTools Network/Console tab bago mag-refresh o magsara ng tab,
      // dahil mawawala kaagad ang console pagkatapos ng navigate/close.
      console.log('[sendBeacon set-offline]', sent ? 'queued ok' : 'FAILED to queue', idTokenRef.current ? '(token present)' : '(NO TOKEN CACHED)');
    };

    // `pagehide` ay mas maaasahan kaysa `beforeunload` sa mga modernong
    // browser (gumagana rin ito kapag pumasok ang page sa bfcache), pero
    // idinagdag pa rin natin ang `beforeunload` bilang extra coverage sa
    // mga browser/scenario na hindi consistent ang pag-fire ng `pagehide`.
    window.addEventListener('pagehide', markOfflineOnClose);
    window.addEventListener('beforeunload', markOfflineOnClose);

    return () => {
      window.removeEventListener('pagehide', markOfflineOnClose);
      window.removeEventListener('beforeunload', markOfflineOnClose);
    };
  }, [firebaseUser?.uid]);

  return (
    <UserContext.Provider value={{ user, setUser, beginLogout, confirmSession, beginLogin, endLogin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}