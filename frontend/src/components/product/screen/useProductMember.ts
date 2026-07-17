import { useEffect, useState } from "react";
import { MEMBER_KEY, MEMBER_TOKEN_KEY, type MemberProfile } from "../shared";
import { hasRequiredCustomerProfile } from "./productCatalog";
import { loginCustomerSession, loadCustomerSession, logoutCustomerSession, requestCustomerPasswordRecovery, resetCustomerPassword, saveCustomerSession, updateCustomerProfile } from "@/services/customerSession";

export function useProductMember(kioskMode: boolean, onReadNotifications?: () => void) {
  const [loginOpen, setLoginOpen] = useState(false); const [profileOpen, setProfileOpen] = useState(false); const [historyOpen, setHistoryOpen] = useState(false); const [notificationsOpen, setNotificationsOpen] = useState(false); const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [memberName, setMemberName] = useState(""); const [memberEmail, setMemberEmail] = useState(""); const [memberCpf, setMemberCpf] = useState(""); const [memberPhone, setMemberPhone] = useState(""); const [memberPassword, setMemberPassword] = useState(""); const [memberPasswordConfirm, setMemberPasswordConfirm] = useState(""); const [memberLogin, setMemberLogin] = useState(""); const [loginPassword, setLoginPassword] = useState("");
  const [memberAuthMode, setMemberAuthMode] = useState<"register" | "login">("register"); const [memberBirthday, setMemberBirthday] = useState(""); const [memberCep, setMemberCep] = useState(""); const [memberStreet, setMemberStreet] = useState(""); const [memberNumber, setMemberNumber] = useState(""); const [memberComplement, setMemberComplement] = useState(""); const [memberNeighborhood, setMemberNeighborhood] = useState(""); const [memberCity, setMemberCity] = useState(""); const [memberReference, setMemberReference] = useState("");
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null); const [memberError, setMemberError] = useState(""); const [memberSaving, setMemberSaving] = useState(false);
  useEffect(() => { if (kioskMode) return; void loadCustomerSession().then((profile) => { const hasToken = typeof window !== "undefined" && localStorage.getItem(MEMBER_TOKEN_KEY); if (hasToken && hasRequiredCustomerProfile(profile)) { setMemberProfile(profile); setLoginOpen(false); return; } setMemberProfile(profile ?? null); setMemberAuthMode("register"); }); }, [kioskMode]);

  const openMemberAccess = () => {
    if (memberProfile && hasRequiredCustomerProfile(memberProfile)) {
      setProfileOpen(true);
      return;
    }
    setMemberAuthMode("register");
    setLoginOpen(true);
  };

  const editMember = () => {
    if (memberProfile) {
      setMemberName(memberProfile.name);
      setMemberEmail(memberProfile.email ?? "");
      setMemberCpf("");
      setMemberPhone(memberProfile.phone);
      setMemberPassword("");
      setMemberPasswordConfirm("");
      setMemberBirthday(memberProfile.birthday ?? "");
    }
    setProfileOpen(false);
    setMemberAuthMode("register");
    setLoginOpen(true);
  };

  const applyMemberProfileUpdate = (profile: MemberProfile) => {
    setMemberProfile(profile);
    setMemberName(profile.name ?? "");
    setMemberEmail(profile.email ?? "");
    setMemberPhone(profile.phone ?? "");
    setMemberBirthday(profile.birthday ?? "");
  };
  const updateMemberProfile = async (payload: Parameters<typeof updateCustomerProfile>[0]) => {
    const profile = await updateCustomerProfile(payload);
    applyMemberProfileUpdate(profile);
    return profile;
  };

  const openHistory = () => {
    if (!hasRequiredCustomerProfile(memberProfile)) {
      setLoginOpen(true);
      return;
    }
    setHistoryOpen(true);
  };

  const openNotifications = () => {
    if (!hasRequiredCustomerProfile(memberProfile)) {
      setLoginOpen(true);
      return;
    }
    onReadNotifications?.();
    setNotificationsOpen(true);
  };

  const saveMember = async () => {
    const name = memberName.trim();
    const email = memberEmail.trim().toLowerCase();
    const phone = memberPhone.trim();
    const password = memberPassword.trim();
    const confirmPassword = memberPasswordConfirm.trim();
    setMemberError("");
    if (!name) {
      setMemberError("Falta preencher: nome.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMemberError("Informe um email válido.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setMemberError("Falta preencher: WhatsApp com DDD.");
      return;
    }
    if (password.length !== 6) {
      setMemberError("Falta preencher: senha de 6 dígitos.");
      return;
    }
    if (confirmPassword.length !== 6) {
      setMemberError("Falta preencher: confirmar senha com 6 dígitos.");
      return;
    }
    if (password !== confirmPassword) {
      setMemberError("A confirmação da senha não confere.");
      return;
    }
    setMemberSaving(true);
    try {
      const profile = await saveCustomerSession({
        name,
        email: email || undefined,
        password,
        confirmPassword,
        phone,
      });
      setMemberProfile(profile);
      setLoginOpen(false);
    } catch {
      localStorage.removeItem(MEMBER_TOKEN_KEY);
      localStorage.removeItem(MEMBER_KEY);
      setMemberProfile(null);
      setLoginOpen(true);
      setMemberError("Não foi possível cadastrar. Confira os dados e tente novamente.");
    } finally {
      setMemberSaving(false);
    }
  };

  const loginMember = async () => {
    const login = memberLogin.trim();
    const password = loginPassword.trim();
    setMemberError("");
    if (!login) {
      setMemberError("Falta preencher: telefone, email ou CPF.");
      return;
    }
    if (password.length !== 6) {
      setMemberError("Falta preencher: senha de 6 dígitos.");
      return;
    }
    setMemberSaving(true);
    try {
      const profile = await loginCustomerSession({ login, password });
      setMemberProfile(profile);
      setLoginOpen(false);
      setMemberLogin("");
      setLoginPassword("");
    } catch {
      setMemberError("Telefone, email, CPF ou senha inválidos.");
    } finally {
      setMemberSaving(false);
    }
  };

  const requestPasswordRecovery = async (login: string) => {
    setMemberError("");
    if (!login.trim()) {
      setMemberError("Informe telefone ou e-mail para recuperar.");
      return null;
    }
    setMemberSaving(true);
    try {
      return await requestCustomerPasswordRecovery({ login: login.trim() });
    } catch {
      setMemberError("Não encontrei esse cadastro. Fale com o suporte.");
      return null;
    } finally {
      setMemberSaving(false);
    }
  };

  const resetMemberPassword = async (
    login: string,
    code: string,
    password: string,
    confirmPassword: string,
  ) => {
    setMemberError("");
    if (code.trim().length !== 6 || password.trim().length !== 6 || password !== confirmPassword) {
      setMemberError("Confira o código e a nova senha de 6 dígitos.");
      return false;
    }
    setMemberSaving(true);
    try {
      const profile = await resetCustomerPassword({
        login: login.trim(),
        code: code.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
      });
      setMemberProfile(profile);
      setLoginOpen(false);
      return true;
    } catch {
      setMemberError("Código inválido ou expirado.");
      return false;
    } finally {
      setMemberSaving(false);
    }
  };

  const logoutMember = () => {
    logoutCustomerSession();
    setMemberProfile(null);
    setMemberName("");
    setMemberEmail("");
    setMemberCpf("");
    setMemberPhone("");
    setMemberPassword("");
    setMemberPasswordConfirm("");
    setMemberAuthMode("login");
    setLoginOpen(true);
  };

  return { loginOpen,setLoginOpen,profileOpen,setProfileOpen,historyOpen,setHistoryOpen,notificationsOpen,setNotificationsOpen,favoritesOpen,setFavoritesOpen,memberName,setMemberName,memberEmail,setMemberEmail,memberCpf,setMemberCpf,memberPhone,setMemberPhone,memberPassword,setMemberPassword,memberPasswordConfirm,setMemberPasswordConfirm,memberLogin,setMemberLogin,loginPassword,setLoginPassword,memberAuthMode,setMemberAuthMode,memberBirthday,setMemberBirthday,memberCep,setMemberCep,memberStreet,setMemberStreet,memberNumber,setMemberNumber,memberComplement,setMemberComplement,memberNeighborhood,setMemberNeighborhood,memberCity,setMemberCity,memberReference,setMemberReference,memberProfile,memberError,memberSaving,openMemberAccess,editMember,openHistory,openNotifications,saveMember,loginMember,requestPasswordRecovery,resetMemberPassword,logoutMember,applyMemberProfileUpdate,updateMemberProfile };
}
