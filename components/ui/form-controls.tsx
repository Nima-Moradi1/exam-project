"use client";

import { Button, Input, Label, ListBox, Select, TextArea, TextField } from "@heroui/react";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

type ButtonTone = "primary" | "secondary" | "outline" | "danger" | "danger-soft" | "ghost";
type AppButtonProps = Omit<ComponentProps<typeof Button>, "className" | "variant"> & {
  className?: string;
  tone?: ButtonTone;
};

export function AppButton({ children, className, tone = "primary", ...props }: AppButtonProps) {
  return <Button className={clsx("ui-button", `ui-button--${tone}`, className)} variant={tone} {...props}>{children}</Button>;
}

type AppTextFieldProps = Omit<ComponentProps<typeof Input>, "className"> & {
  className?: string;
  fieldClassName?: string;
  label: ReactNode;
};

export function AppTextField({ className, fieldClassName, label, ...props }: AppTextFieldProps) {
  return <TextField className={clsx("ui-field", fieldClassName)} fullWidth>
    <Label>{label}</Label>
    <Input className={clsx("ui-input", className)} variant="secondary" {...props} />
  </TextField>;
}

type AppTextAreaProps = Omit<ComponentProps<typeof TextArea>, "className"> & {
  className?: string;
  fieldClassName?: string;
  label: ReactNode;
};

export function AppTextArea({ className, fieldClassName, label, ...props }: AppTextAreaProps) {
  return <TextField className={clsx("ui-field", fieldClassName)} fullWidth>
    <Label>{label}</Label>
    <TextArea className={clsx("ui-textarea", className)} variant="secondary" {...props} />
  </TextField>;
}

export type AppSelectOption = { value: string; label: string; disabled?: boolean };

type AppSelectProps = {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  label: ReactNode;
  name?: string;
  onChange?: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  required?: boolean;
  value?: string;
};

export function AppSelect({ className, defaultValue, disabled, label, name, onChange, options, placeholder, required, value }: AppSelectProps) {
  const selection = value === undefined ? { defaultValue: defaultValue || null } : { value: value || null };
  return <Select className={clsx("ui-select", className)} fullWidth isDisabled={disabled} isRequired={required} name={name} onChange={(key) => onChange?.(String(key ?? ""))} placeholder={placeholder} variant="secondary" {...selection}>
    <Label>{label}</Label>
    <Select.Trigger>
      <Select.Value />
      <Select.Indicator />
    </Select.Trigger>
    <Select.Popover placement="bottom">
      <ListBox>
        {options.map((option) => <ListBox.Item id={option.value} isDisabled={option.disabled} key={option.value} textValue={option.label}>
          {option.label}
          <ListBox.ItemIndicator />
        </ListBox.Item>)}
      </ListBox>
    </Select.Popover>
  </Select>;
}
