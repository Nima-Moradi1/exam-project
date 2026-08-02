"use client";

import { Modal } from "@heroui/react";
import clsx from "clsx";
import type { ReactNode } from "react";

type AppModalProps = {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: ReactNode;
};

export function AppModal({ children, className, footer, isOpen, onOpenChange, title }: AppModalProps) {
  return <Modal>
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur">
      <Modal.Container placement="center" size="lg">
        <Modal.Dialog className={clsx("ui-modal", className)}>
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
            <Modal.CloseTrigger aria-label="بستن" />
          </Modal.Header>
          <Modal.Body>{children}</Modal.Body>
          {footer && <Modal.Footer>{footer}</Modal.Footer>}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  </Modal>;
}
