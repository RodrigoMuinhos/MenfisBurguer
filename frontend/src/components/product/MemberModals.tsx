import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useState,
  type ElementType,
  type HTMLInputTypeAttribute,
  type ReactNode,
} from "react";
import {
  Eye,
  EyeOff,
  ChevronRight,
  Gift,
  Headphones,
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  PackageSearch,
  UserCog,
  X,
} from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { CartItem, Order } from "@/types/order";
import { MEMBER_TOKEN_KEY, MemberProfile } from "./shared";
import { API_URL, SUPPORT_WHATSAPP_URL } from "@/components/order/checkout";
import { STATUS_COPY, fmt } from "@/components/order/tracking";
import { normalizeBackendOrder } from "@/services/orders/normalize";
import { MemberNotification } from "./notifications";
import {
  ActiveProfileOrderCard,
  InfoLine,
  OrderHistoryRow,
  ProfileInput,
  ProfileMenuButton,
  ProfileMenuLink,
  ProfileSection,
  SidePanel,
} from "./member/MemberUi";
import { MemberActivityPanels } from "./member/MemberActivityPanels";
import { MemberProfilePanel } from "./member/MemberProfilePanel";
import { MemberAuthModal } from "./member/MemberAuthModal";

const BRAND_M_LOGO = "/logo_M.jpeg";

export function MemberModals({
  loginOpen,
  profileOpen,
  historyOpen,
  notificationsOpen,
  favoritesOpen,
  memberProfile,
  memberName,
  setMemberName,
  memberEmail,
  setMemberEmail,
  memberCpf,
  setMemberCpf,
  memberPhone,
  setMemberPhone,
  memberPassword,
  setMemberPassword,
  memberPasswordConfirm,
  setMemberPasswordConfirm,
  memberLogin,
  setMemberLogin,
  loginPassword,
  setLoginPassword,
  memberAuthMode,
  setMemberAuthMode,
  memberBirthday,
  setMemberBirthday,
  memberCep,
  setMemberCep,
  memberStreet,
  setMemberStreet,
  memberNumber,
  setMemberNumber,
  memberComplement,
  setMemberComplement,
  memberNeighborhood,
  setMemberNeighborhood,
  memberCity,
  setMemberCity,
  memberReference,
  setMemberReference,
  memberError,
  memberSaving,
  savedDelivery,
  saveMember,
  loginMember,
  requestPasswordRecovery,
  resetMemberPassword,
  editMember,
  updateMemberProfile,
  logoutMember,
  loginRequired = false,
  closeLogin,
  closeProfile,
  closeHistory,
  closeNotifications,
  closeFavorites,
  activeOrder,
  notifications = [],
  onOpenActiveOrder,
  onRepeatOrder,
}: {
  loginOpen: boolean;
  profileOpen: boolean;
  historyOpen: boolean;
  notificationsOpen: boolean;
  favoritesOpen: boolean;
  memberProfile: MemberProfile | null;
  memberName: string;
  setMemberName: (value: string) => void;
  memberEmail: string;
  setMemberEmail: (value: string) => void;
  memberCpf: string;
  setMemberCpf: (value: string) => void;
  memberPhone: string;
  setMemberPhone: (value: string) => void;
  memberPassword: string;
  setMemberPassword: (value: string) => void;
  memberPasswordConfirm: string;
  setMemberPasswordConfirm: (value: string) => void;
  memberLogin: string;
  setMemberLogin: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  memberAuthMode: "register" | "login";
  setMemberAuthMode: (value: "register" | "login") => void;
  memberBirthday: string;
  setMemberBirthday: (value: string) => void;
  memberCep: string;
  setMemberCep: (value: string) => void;
  memberStreet: string;
  setMemberStreet: (value: string) => void;
  memberNumber: string;
  setMemberNumber: (value: string) => void;
  memberComplement: string;
  setMemberComplement: (value: string) => void;
  memberNeighborhood: string;
  setMemberNeighborhood: (value: string) => void;
  memberCity: string;
  setMemberCity: (value: string) => void;
  memberReference: string;
  setMemberReference: (value: string) => void;
  memberError: string;
  memberSaving: boolean;
  savedDelivery: Record<string, string>;
  saveMember: () => void;
  loginMember: () => void;
  requestPasswordRecovery: (
    login: string,
  ) => Promise<{ expiresInMinutes?: number; delivery?: string } | null>;
  resetMemberPassword: (
    login: string,
    code: string,
    password: string,
    confirmPassword: string,
  ) => Promise<boolean>;
  editMember: () => void;
  updateMemberProfile: (payload: {
    name: string;
    phone: string;
    email?: string;
    currentPassword: string;
    newPassword?: string;
    confirmPassword?: string;
  }) => Promise<MemberProfile>;
  logoutMember: () => void;
  loginRequired?: boolean;
  closeLogin: () => void;
  closeProfile: () => void;
  closeHistory: () => void;
  closeNotifications: () => void;
  closeFavorites: () => void;
  activeOrder?: Order | null;
  notifications?: MemberNotification[];
  onOpenActiveOrder?: (orderId?: string) => void;
  onRepeatOrder?: (items: CartItem[]) => void;
}) {
  const canCloseLogin = !loginRequired;
  const profileIncomplete = Boolean(
    memberProfile &&
    (!memberProfile.phone?.trim() || memberProfile.hasPassword === false),
  );
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryLogin, setRecoveryLogin] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState("");
  const [recoverySentMessage, setRecoverySentMessage] = useState("");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileEditName, setProfileEditName] = useState("");
  const [profileEditPhone, setProfileEditPhone] = useState("");
  const [profileEditEmail, setProfileEditEmail] = useState("");
  const [profileCurrentPassword, setProfileCurrentPassword] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [profileEditError, setProfileEditError] = useState("");
  const [profileEditSaving, setProfileEditSaving] = useState(false);
  const visibleActiveOrder =
    activeOrder && !["DELIVERED", "CANCELLED"].includes(activeOrder.status)
      ? activeOrder
      : customerOrders.find(
          (order) => !["DELIVERED", "CANCELLED"].includes(order.status),
        );
  const hasActiveOrder = Boolean(visibleActiveOrder);

  useEffect(() => {
    if (
      (!profileOpen && !historyOpen && !notificationsOpen) ||
      !memberProfile ||
      !API_URL ||
      typeof window === "undefined"
    )
      return;
    const token = localStorage.getItem(MEMBER_TOKEN_KEY);
    if (!token) return;
    const controller = new AbortController();
    setOrdersLoading(true);
    void fetch(`${API_URL}/customers/orders`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        setCustomerOrders(
          Array.isArray(rows) ? rows.map(normalizeBackendOrder) : [],
        );
      })
      .catch(() => setCustomerOrders([]))
      .finally(() => setOrdersLoading(false));
    return () => controller.abort();
  }, [historyOpen, memberProfile, notificationsOpen, profileOpen]);

  useEffect(() => {
    if (memberAuthMode === "login") return;
    setRegisterStep(1);
    setTermsAccepted(false);
  }, [memberAuthMode, loginOpen]);

  useEffect(() => {
    if (!loginOpen) {
      setRecoveryOpen(false);
      setRecoveryCode("");
      setRecoveryPassword("");
      setRecoveryPasswordConfirm("");
      setRecoverySentMessage("");
    }
  }, [loginOpen]);

  const openProfileEdit = () => {
    if (!memberProfile) return;
    setProfileEditName(memberProfile.name ?? "");
    setProfileEditPhone(memberProfile.phone ?? "");
    setProfileEditEmail(memberProfile.email ?? "");
    setProfileCurrentPassword("");
    setProfileNewPassword("");
    setProfileConfirmPassword("");
    setProfileEditError("");
    setProfileEditOpen(true);
  };

  const submitProfileEdit = async () => {
    const name = profileEditName.trim();
    const phone = profileEditPhone.trim();
    const email = profileEditEmail.trim().toLowerCase();
    const currentPassword = profileCurrentPassword.trim();
    const newPassword = profileNewPassword.trim();
    const confirmPassword = profileConfirmPassword.trim();
    setProfileEditError("");
    if (!name) {
      setProfileEditError("Informe seu nome.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setProfileEditError("Informe um WhatsApp com DDD.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setProfileEditError("Informe um e-mail válido.");
      return;
    }
    if (currentPassword.length !== 6) {
      setProfileEditError("Digite sua senha atual de 6 dígitos para editar.");
      return;
    }
    if (
      (newPassword || confirmPassword) &&
      (newPassword.length !== 6 || newPassword !== confirmPassword)
    ) {
      setProfileEditError(
        "A nova senha precisa ter 6 dígitos e conferir com a confirmação.",
      );
      return;
    }
    setProfileEditSaving(true);
    try {
      await updateMemberProfile({
        name,
        phone,
        email: email || undefined,
        currentPassword,
        newPassword: newPassword || undefined,
        confirmPassword: confirmPassword || undefined,
      });
      setProfileEditOpen(false);
      setProfileCurrentPassword("");
      setProfileNewPassword("");
      setProfileConfirmPassword("");
    } catch {
      setProfileEditError("Senha atual incorreta ou dados inválidos.");
    } finally {
      setProfileEditSaving(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <MemberAuthModal
          key="member-auth-modal"
          loginOpen={loginOpen}
          loginRequired={loginRequired}
          canCloseLogin={canCloseLogin}
          memberAuthMode={memberAuthMode}
          setMemberAuthMode={setMemberAuthMode}
          registerStep={registerStep}
          setRegisterStep={setRegisterStep}
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
          recoveryOpen={recoveryOpen}
          setRecoveryOpen={setRecoveryOpen}
          recoveryLogin={recoveryLogin}
          setRecoveryLogin={setRecoveryLogin}
          recoveryCode={recoveryCode}
          setRecoveryCode={setRecoveryCode}
          recoveryPassword={recoveryPassword}
          setRecoveryPassword={setRecoveryPassword}
          recoveryPasswordConfirm={recoveryPasswordConfirm}
          setRecoveryPasswordConfirm={setRecoveryPasswordConfirm}
          recoverySentMessage={recoverySentMessage}
          setRecoverySentMessage={setRecoverySentMessage}
          memberName={memberName}
          setMemberName={setMemberName}
          memberEmail={memberEmail}
          setMemberEmail={setMemberEmail}
          memberCpf={memberCpf}
          setMemberCpf={setMemberCpf}
          memberPhone={memberPhone}
          setMemberPhone={setMemberPhone}
          memberPassword={memberPassword}
          setMemberPassword={setMemberPassword}
          memberPasswordConfirm={memberPasswordConfirm}
          setMemberPasswordConfirm={setMemberPasswordConfirm}
          memberLogin={memberLogin}
          setMemberLogin={setMemberLogin}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          memberBirthday={memberBirthday}
          setMemberBirthday={setMemberBirthday}
          memberCep={memberCep}
          setMemberCep={setMemberCep}
          memberStreet={memberStreet}
          setMemberStreet={setMemberStreet}
          memberNumber={memberNumber}
          setMemberNumber={setMemberNumber}
          memberComplement={memberComplement}
          setMemberComplement={setMemberComplement}
          memberNeighborhood={memberNeighborhood}
          setMemberNeighborhood={setMemberNeighborhood}
          memberCity={memberCity}
          setMemberCity={setMemberCity}
          memberReference={memberReference}
          setMemberReference={setMemberReference}
          memberError={memberError}
          memberSaving={memberSaving}
          savedDelivery={savedDelivery}
          saveMember={saveMember}
          loginMember={loginMember}
          requestPasswordRecovery={requestPasswordRecovery}
          resetMemberPassword={resetMemberPassword}
          closeLogin={closeLogin}
        />
        <MemberProfilePanel
          key="member-profile-panel"
          profileOpen={profileOpen}
          memberProfile={memberProfile}
          profileIncomplete={profileIncomplete}
          profileEditOpen={profileEditOpen}
          profileEditName={profileEditName}
          profileEditPhone={profileEditPhone}
          profileEditEmail={profileEditEmail}
          profileCurrentPassword={profileCurrentPassword}
          profileNewPassword={profileNewPassword}
          profileConfirmPassword={profileConfirmPassword}
          profileEditError={profileEditError}
          profileEditSaving={profileEditSaving}
          ordersLoading={ordersLoading}
          visibleActiveOrder={visibleActiveOrder}
          hasActiveOrder={hasActiveOrder}
          closeProfile={closeProfile}
          editMember={editMember}
          setProfileEditOpen={setProfileEditOpen}
          setProfileEditName={setProfileEditName}
          setProfileEditPhone={setProfileEditPhone}
          setProfileEditEmail={setProfileEditEmail}
          setProfileCurrentPassword={setProfileCurrentPassword}
          setProfileNewPassword={setProfileNewPassword}
          setProfileConfirmPassword={setProfileConfirmPassword}
          submitProfileEdit={submitProfileEdit}
          openProfileEdit={openProfileEdit}
          onOpenActiveOrder={onOpenActiveOrder}
          logoutMember={logoutMember}
        />
        <MemberActivityPanels
          key="member-activity-panels"
          historyOpen={historyOpen}
          notificationsOpen={notificationsOpen}
          favoritesOpen={favoritesOpen}
          memberProfile={memberProfile}
          ordersLoading={ordersLoading}
          customerOrders={customerOrders}
          notifications={notifications}
          visibleActiveOrder={visibleActiveOrder}
          hasActiveOrder={hasActiveOrder}
          closeHistory={closeHistory}
          closeNotifications={closeNotifications}
          closeFavorites={closeFavorites}
          onOpenActiveOrder={onOpenActiveOrder}
          onRepeatOrder={onRepeatOrder}
        />
      </AnimatePresence>
    </>
  );
}
