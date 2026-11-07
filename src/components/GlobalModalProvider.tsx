"use client";

import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";

import { Modal, type ModalFuncProps } from "antd";

export type TGlobalModalKind = "info" | "success" | "error" | "warning";

export type TGlobalModalContext = {
  /** 在全局 Modal 容器中展示弹窗，避免业务组件各自创建静态实例。 */
  showModal: (config: ModalFuncProps, kind?: TGlobalModalKind) => void;
};

const GlobalModalContext = createContext<TGlobalModalContext | null>(null);

export const GlobalModalProvider = ({ children }: PropsWithChildren) => {
  const [modal, modalContextHolder] = Modal.useModal();
  const value = useMemo<TGlobalModalContext>(
    () => ({
      showModal: (config, kind = "info") => {
        modal[kind](config);
      },
    }),
    [modal],
  );

  return (
    <GlobalModalContext.Provider value={value}>
      {children}
      {modalContextHolder}
    </GlobalModalContext.Provider>
  );
};

export const useGlobalModal = () => {
  const context = useContext(GlobalModalContext);
  if (!context) {
    throw new Error("useGlobalModal 必须在 GlobalModalProvider 内使用");
  }
  return context;
};
