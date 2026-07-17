import { Loader2, Headphones } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import type { CartItem, Order } from "@/types/order";
import type { MemberProfile } from "../shared";
import type { MemberNotification } from "../notifications";
import { STATUS_COPY } from "@/components/order/tracking";
import { SUPPORT_WHATSAPP_URL } from "@/components/order/checkout";
import { OrderHistoryRow, SidePanel } from "./MemberUi";

export function MemberActivityPanels({ historyOpen, notificationsOpen, favoritesOpen, memberProfile, ordersLoading, customerOrders, notifications, visibleActiveOrder, hasActiveOrder, closeHistory, closeNotifications, closeFavorites, onOpenActiveOrder, onRepeatOrder }: {
 historyOpen: boolean; notificationsOpen: boolean; favoritesOpen: boolean; memberProfile: MemberProfile | null; ordersLoading: boolean; customerOrders: Order[]; notifications: MemberNotification[]; visibleActiveOrder?: Order | null; hasActiveOrder: boolean; closeHistory: () => void; closeNotifications: () => void; closeFavorites: () => void; onOpenActiveOrder?: (orderId?: string) => void; onRepeatOrder?: (items: CartItem[]) => void;
}) { return <>              {historyOpen && memberProfile && (
                <SidePanel title="Histórico de pedidos" onClose={closeHistory}>
                  <div className="grid gap-2">
                    {ordersLoading && (
                      <div className="flex justify-center py-8">
                        <Loader2 size={22} strokeWidth={2.5} style={{ animation: "spin 1s linear infinite" }} />
                      </div>
                    )}
                    {!ordersLoading && customerOrders.length === 0 && (
                      <p className="rounded-2xl p-4 text-xs font-bold opacity-60" style={{ background: "#fff" }}>
                        Nenhum pedido encontrado neste perfil.
                      </p>
                    )}
                    {customerOrders.map((order) => (
                      <OrderHistoryRow
                        key={order.id}
                        order={order}
                        onOpen={() => {
                          closeHistory();
                          onOpenActiveOrder?.(order.id);
                        }}
                        onRepeat={() => {
                          closeHistory();
                          onRepeatOrder?.(order.items);
                        }}
                      />
                    ))}
                  </div>
                </SidePanel>
              )}

              {notificationsOpen && memberProfile && (
                <SidePanel title="Notificações" onClose={closeNotifications}>
                  <div className="grid gap-3">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            closeNotifications();
                            onOpenActiveOrder?.(visibleActiveOrder?.id);
                          }}
                          className="rounded-2xl p-4 text-left"
                          style={{
                            background: notification.read ? "#fff" : VERDE,
                            color: notification.read ? VERDE : ROSA,
                            border: `1px solid ${notification.read ? `${VERDE}12` : VERDE}`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-wider opacity-70">
                                Pedido {notification.orderId}
                              </p>
                              <p className="mt-1 text-base font-black leading-tight">
                                {notification.title}
                              </p>
                            </div>
                            {!notification.read && (
                              <span
                                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ background: ROSA, border: "1px solid #fff" }}
                              />
                            )}
                          </div>
                          <p className="mt-2 text-xs font-bold leading-relaxed opacity-75">
                            {notification.message}
                          </p>
                          <p className="mt-3 text-[10px] font-black uppercase tracking-wider opacity-50">
                            {new Date(notification.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl p-4 text-xs font-bold" style={{ background: "#fff", border: `1px solid ${VERDE}12` }}>
                        Nenhuma notificação nova.
                      </div>
                    )}
                    {hasActiveOrder && visibleActiveOrder && (
                      <button
                        type="button"
                        onClick={() => {
                          closeNotifications();
                            onOpenActiveOrder?.(visibleActiveOrder.id);
                        }}
                        className="rounded-2xl p-4 text-left"
                        style={{ background: "#fff", color: VERDE, border: `1px solid ${VERDE}12` }}
                      >
                        <p className="text-xs font-black uppercase tracking-wider">Acompanhar pedido</p>
                        <p className="mt-1 text-lg font-black">{visibleActiveOrder.id} · {(STATUS_COPY[visibleActiveOrder.status] ?? STATUS_COPY.PAYMENT_PENDING).label}</p>
                        <p className="mt-1 text-xs font-bold opacity-75">Toque para abrir a linha do tempo.</p>
                      </button>
                    )}
                    <a
                      href={SUPPORT_WHATSAPP_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl p-4 text-xs font-black uppercase tracking-wider"
                      style={{ background: "#fff", color: VERDE, border: `1px solid ${VERDE}12` }}
                    >
                      <Headphones size={18} strokeWidth={2.4} />
                      Chat com atendimento
                    </a>
                    <div className="rounded-2xl p-4 text-xs font-bold leading-relaxed" style={{ background: "#fff", border: `1px solid ${VERDE}12` }}>
                      Aqui ficam os avisos que o sistema envia: pagamento, preparo, pedido pronto, entrega e conversas com atendimento.
                    </div>
                  </div>
                </SidePanel>
              )}

              {favoritesOpen && (
                <SidePanel title="Favoritos" onClose={closeFavorites}>
                  <div className="rounded-2xl p-4 text-xs font-bold leading-relaxed" style={{ background: "#fff", border: `1px solid ${VERDE}12` }}>
                    Seus favoritos aparecerão aqui para pedir de novo mais rápido.
                  </div>
                </SidePanel>
              )}
</>; }
