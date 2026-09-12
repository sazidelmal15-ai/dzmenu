"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Sliders } from "lucide-react";
import { evaluateCondition, getNestedValue } from "@/lib/themes/conditions";
import type {
  EditorControlGroup,
  EditorControl,
} from "@/types/theme-contract";
import { ColorPickerControl } from "./controls/ColorPickerControl";
import { FontSelectControl } from "./controls/FontSelectControl";
import { SliderControl } from "./controls/SliderControl";
import { ToggleControl } from "./controls/ToggleControl";
import { SelectControl } from "./controls/SelectControl";
import { SegmentedControl } from "./controls/SegmentedControl";
import { TextControl } from "./controls/TextControl";
import { ImageSlotUploadControl } from "./controls/ImageSlotUploadControl";
import { PaletteControl } from "./controls/PaletteControl";

export interface DynamicControlsEngineProps {
  groups: EditorControlGroup[];
  settings: Record<string, unknown>;
  imageSlots?: Record<string, string | null>;
  fallbackImages?: Record<string, string | null>;
  onSettingChange: (field: string, value: unknown) => void;
  onImageSlotChange?: (
    slotId: string,
    url: string | null,
    file?: File | null,
    framing?: any
  ) => void;
  disabled?: boolean;
}

export function DynamicControlsEngine({
  groups,
  settings,
  imageSlots = {},
  fallbackImages = {},
  onSettingChange,
  onImageSlotChange,
  disabled = false,
}: DynamicControlsEngineProps) {
  // Track open state for accordion groups (default all open)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of groups) {
      initial[g.id] = true;
    }
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const renderControlBody = (control: EditorControl) => {
    if (control.type === "image") {
      const slotValue =
        imageSlots[control.slotId] ??
        (getNestedValue(settings, control.field) as string | null) ??
        null;
      const fallbackUrl = fallbackImages[control.slotId] ?? null;
      const framingValue = (getNestedValue(settings, `image_framing.${control.slotId}`) as any) ?? null;

      return (
        <ImageSlotUploadControl
          control={control}
          value={slotValue}
          framingValue={framingValue}
          fallbackUrl={fallbackUrl}
          onChange={(url, file, framing) => {
            if (onImageSlotChange) {
              onImageSlotChange(control.slotId, url, file, framing);
            } else {
              onSettingChange(control.field, url);
              if (framing !== undefined) {
                onSettingChange(`image_framing.${control.slotId}`, framing);
              }
            }
          }}
          disabled={disabled}
        />
      );
    }

    const value = getNestedValue(settings, control.field);

      switch (control.type) {
        case "color":
          return (
            <ColorPickerControl
              control={control}
              value={value}
              onChange={(val) => onSettingChange(control.field, val)}
              disabled={disabled}
            />
          );

        case "font":
          return (
            <FontSelectControl
              control={control}
              value={value}
              onChange={(val) => onSettingChange(control.field, val)}
              disabled={disabled}
            />
          );

        case "slider":
          return (
            <SliderControl
              control={control}
              value={value}
              onChange={(val) => onSettingChange(control.field, val)}
              disabled={disabled}
            />
          );

        case "toggle":
          return (
            <ToggleControl
              control={control}
              value={value}
              onChange={(val) => onSettingChange(control.field, val)}
              disabled={disabled}
            />
          );

        case "select":
          return (
            <SelectControl
              control={control}
              value={value}
              onChange={(val) => onSettingChange(control.field, val)}
              disabled={disabled}
            />
          );

        case "segmented":
          return (
            <SegmentedControl
              control={control}
              value={value}
              onChange={(val) => onSettingChange(control.field, val)}
              disabled={disabled}
            />
          );

        case "text":
          return (
            <TextControl
              control={control}
              value={value}
              onChange={(val) => onSettingChange(control.field, val)}
              disabled={disabled}
            />
          );

        case "palette":
          return (
            <PaletteControl
              control={control}
              value={value}
              onChange={(val) => onSettingChange(control.field, val)}
              disabled={disabled}
            />
          );

        default:
          return null;
      }
    };

  // Group consecutive indented visible controls into a connected sub-group
  type ControlItem =
    | { type: "single"; control: EditorControl }
    | { type: "indented_group"; controls: EditorControl[] };

  const getRenderItems = (controls: EditorControl[]): ControlItem[] => {
    const visible = controls.filter((ctrl) =>
      evaluateCondition(ctrl.visibleIf, settings)
    );
    const items: ControlItem[] = [];
    let currentIndented: EditorControl[] = [];

    for (const ctrl of visible) {
      if (ctrl.indent) {
        currentIndented.push(ctrl);
      } else {
        if (currentIndented.length > 0) {
          items.push({ type: "indented_group", controls: currentIndented });
          currentIndented = [];
        }
        items.push({ type: "single", control: ctrl });
      }
    }

    if (currentIndented.length > 0) {
      items.push({ type: "indented_group", controls: currentIndented });
    }

    return items;
  };

  if (groups.length === 0) {
    return (
      <div className="p-8 text-center text-white/40 text-xs">
        <Sliders className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
        No customizable controls defined for this theme.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isOpen = openGroups[group.id] !== false;
        // Count visible controls
        const visibleControls = group.controls.filter((ctrl) =>
          evaluateCondition(ctrl.visibleIf, settings)
        );

        if (visibleControls.length === 0) return null;

        return (
          <div
            key={group.id}
            className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden transition-all"
          >
            {/* Group Header Accordion */}
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition-colors text-left"
            >
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-xs font-semibold text-white truncate">
                  {group.title}
                </h3>
                {group.description && (
                  <p className="text-[10px] text-white/40 truncate mt-0.5">
                    {group.description}
                  </p>
                )}
              </div>
              <div className="text-white/40">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Group Body */}
            {isOpen && (
              <div className="px-4 pb-3 pt-1 space-y-1.5 border-t border-white/5">
                {getRenderItems(group.controls).map((item, idx) => {
                  if (item.type === "single") {
                    return (
                      <div
                        key={item.control.id}
                        className="py-1.5 border-b border-white/[0.04] last:border-b-0"
                      >
                        {renderControlBody(item.control)}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`indented-group-${idx}`}
                      className="ml-3 my-2 pl-3.5 pr-2.5 py-2.5 rounded-xl bg-black/40 border border-white/5 border-l-2 border-l-amber-500/70 space-y-1.5 shadow-inner"
                    >
                      {item.controls.map((ctrl) => (
                        <div key={ctrl.id} className="py-0.5">
                          {renderControlBody(ctrl)}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
