// src/components/MobileScaffold.jsx
import React from "react";
import { Flex, Button, Grid, Segmented } from "antd";
import {
    SettingOutlined,
    DownloadOutlined,
    HomeOutlined,
    PlusCircleOutlined,
    BarChartOutlined,
    PoweroffOutlined,
} from "@ant-design/icons";
import "./mobile.css";

const { useBreakpoint } = Grid;

/**
 * Props:
 *  - title, subtitle, statusText
 *  - periodValue, onPeriodChange
 *  - onEditProfile, onInstall, onLogout
 *  - showBottomNav (bool) -> default false (oculta barra inferior)
 */
export default function MobileScaffold({
    title = "Hola 👋",
    subtitle = "Bienvenido a tu registro personal.",
    statusText = "Conectado",
    periodValue,
    onPeriodChange,
    onEditProfile,
    onInstall,
    onLogout,
    showBottomNav = false,
    children,
}) {
    const screens = useBreakpoint();
    const isMobile = screens.xs && !screens.md;

    if (!isMobile) return <>{children}</>;

    return (
        <div className="m-root">
            {/* Header */}
            <header className="m-header card-soft">
                <Flex justify="space-between" align="start" gap={12} wrap>
                    <div className="m-hello">
                        <h1 className="m-title">{title}</h1>
                        <p className="m-sub">{subtitle}</p>
                        <span className="chip chip-online">{statusText}</span>
                    </div>

                    <Flex gap={8} wrap className="m-actions">
                        <Button className="btn-soft" icon={<SettingOutlined />} onClick={onEditProfile}>
                            Editar perfil
                        </Button>
                        <Button className="btn-soft" icon={<DownloadOutlined />} onClick={onInstall}>
                            Instalar
                        </Button>
                        {/* 👇 Ahora el logout visible también en móvil (rojo/blanco) */}
                        <Button className="logout-btn" icon={<PoweroffOutlined />} onClick={onLogout}>
                            Salir
                        </Button>
                    </Flex>
                </Flex>
            </header>

            <main className="m-content">{children}</main>

            {/* Segmentos de periodo (si lo usas) */}
            {typeof onPeriodChange === "function" && (
                <section className="m-section card-soft">
                    <h3 className="m-section-title">Ver datos por periodo</h3>
                    <Segmented
                        block
                        size="large"
                        value={periodValue}
                        className="seg-pill"
                        onChange={onPeriodChange}
                        options={["Este mes", "Últimos 3 meses", "Últimos 6 meses", "Este año"]}
                    />
                </section>
            )}

            {/* 👇 Barra inferior ahora es opcional (apagada por defecto) */}
            {showBottomNav && (
                <nav className="m-bottom-nav">
                    <button className="m-nav-item active">
                        <HomeOutlined />
                        <span>Inicio</span>
                    </button>
                    <button className="m-nav-item">
                        <PlusCircleOutlined />
                        <span>Registro</span>
                    </button>
                    <button className="m-nav-item">
                        <BarChartOutlined />
                        <span>Reportes</span>
                    </button>
                </nav>
            )}
        </div>
    );
}
