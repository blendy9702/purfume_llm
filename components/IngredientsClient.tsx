"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import type { Ingredient } from "@/lib/supabase";
import {
  formatNoteLayers,
  getNoteLayers,
  ingredientMatchesNoteFilter,
  ingredientToFormData,
  NOTE_LAYERS,
  type NoteLayer,
} from "@/lib/ingredients";

const FILTER_ALL = "filter-all";
const FILTER_OIL_ALL = "filter-oil-all";

const NOTE_LAYER_OPTIONS = [
  { value: "top", label: "탑 노트", color: "#c3faf5", textColor: "#187574" },
  {
    value: "middle",
    label: "미들 노트",
    color: "#fde0f0",
    textColor: "#9d174d",
  },
  {
    value: "base",
    label: "베이스 노트",
    color: "#ffe6cd",
    textColor: "#92400e",
  },
] as const;

const FILTER_CATEGORIES = [
  { value: FILTER_ALL, label: "전체" },
  ...NOTE_LAYER_OPTIONS,
  { value: "carrier", label: "첨가제", color: "#dbeafe", textColor: "#1e40af" },
];

const NOTE_LAYER_MAP: Record<
  NoteLayer,
  { label: string; color: string; textColor: string }
> = {
  top: { label: "탑", color: "#c3faf5", textColor: "#187574" },
  middle: { label: "미들", color: "#fde0f0", textColor: "#9d174d" },
  base: { label: "베이스", color: "#ffe6cd", textColor: "#92400e" },
};

const CARRIER_BADGE = {
  label: "용제",
  color: "#dbeafe",
  textColor: "#1e40af",
};

const OIL_TYPES = [
  { value: "essential", label: "에센셜 오일", color: "#ecfdf5", textColor: "#047857" },
  { value: "fragrance", label: "프래그런스 오일", color: "#fef3c7", textColor: "#b45309" },
] as const;

const OIL_TYPE_MAP: Record<string, { label: string; color: string; textColor: string }> = {
  essential: { label: "에센셜", color: "#ecfdf5", textColor: "#047857" },
  fragrance: { label: "프래그런스", color: "#fef3c7", textColor: "#b45309" },
};

type FormData = {
  kind: "fragrance" | "carrier";
  note_layers: NoteLayer[];
  oil_type: string;
  scent_profile: string;
  namesText: string;
};

const INITIAL_FORM: FormData = {
  kind: "fragrance",
  note_layers: ["top"],
  oil_type: "essential",
  scent_profile: "",
  namesText: "",
};

function toggleNoteLayer(layers: NoteLayer[], layer: NoteLayer): NoteLayer[] {
  if (layers.includes(layer)) {
    return layers.filter((item) => item !== layer);
  }
  return [...layers, layer].sort(
    (a, b) => NOTE_LAYERS.indexOf(a) - NOTE_LAYERS.indexOf(b)
  );
}

function parseNames(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const ingredientCardVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.96,
  },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.04,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
  exit: {
    opacity: 0,
    y: -14,
    scale: 0.94,
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function IngredientsClient() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>(FILTER_ALL);
  const [filterOilType, setFilterOilType] = useState<string>(FILTER_OIL_ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pendingNames = parseNames(form.namesText);
  const isEditing = editingId !== null;

  function openAddForm() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setError("");
    setShowForm(true);
  }

  function openEditForm(ingredient: Ingredient) {
    setEditingId(ingredient.id);
    setForm(ingredientToFormData(ingredient));
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
    setError("");
  }

  const fetchIngredients = useCallback(async () => {
    const res = await fetch("/api/ingredients");
    if (res.ok) {
      const data = await res.json();
      setIngredients(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const filteredIngredients = ingredients.filter((i) => {
    const matchesCategory =
      filterCategory === FILTER_ALL ||
      ingredientMatchesNoteFilter(i, filterCategory);
    const matchesOilType =
      filterOilType === FILTER_OIL_ALL || i.oil_type === filterOilType;
    const matchesSearch =
      !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.scent_profile ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesOilType && matchesSearch;
  });

  function toggleOilFilter(value: "essential" | "fragrance") {
    setFilterOilType((prev) => (prev === value ? FILTER_OIL_ALL : value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const names = parseNames(form.namesText);
    if (names.length === 0) {
      setError(isEditing ? "재료명을 입력해주세요." : "추가할 재료명을 입력해주세요.");
      return;
    }

    if (isEditing && names.length > 1) {
      setError("수정 시에는 재료명을 하나만 입력할 수 있습니다.");
      return;
    }

    if (form.kind === "fragrance" && form.note_layers.length === 0) {
      setError("노트 구분을 1개 이상 선택해주세요.");
      return;
    }

    if (form.kind === "fragrance" && !form.oil_type) {
      setError("오일 종류를 선택해주세요.");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: names[0],
      category: form.kind === "carrier" ? "carrier" : "fragrance",
      note_layers: form.kind === "carrier" ? null : form.note_layers,
      oil_type: form.kind === "carrier" ? null : form.oil_type,
      scent_profile: form.scent_profile || undefined,
    };

    const res = isEditing
      ? await fetch(`/api/ingredients/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/ingredients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: names.map((name) => ({ ...payload, name })),
          }),
        });

    if (res.ok) {
      closeForm();
      fetchIngredients();
    } else {
      const data = await res.json();
      setError(data.error ?? "오류가 발생했습니다.");
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    if (editingId === id) closeForm();
    setDeletingId(null);
  }

  const inputStyle = {
    width: "100%",
    height: "44px",
    padding: "0 14px",
    border: "1px solid #c7cad5",
    borderRadius: "10px",
    background: "#fff",
    color: "#1c1c1e",
    outline: "none",
    fontSize: "16px",
  };

  return (
    <div style={{ width: "100%" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "#1c1c1e",
              margin: "0 0 6px",
              letterSpacing: "-0.5px",
            }}
          >
            재료 관리
          </h1>
          <p style={{ fontSize: "14px", color: "#8e91a0", margin: 0 }}>
            {ingredients.length}종의 재료가 등록되어 있습니다
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAddForm}
          style={{
            padding: "10px 20px",
            background: "#1c1c1e",
            color: "#ffffff",
            border: "none",
            borderRadius: "9999px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          + 재료 추가
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #eef0f3",
              boxShadow: "rgba(5, 0, 56, 0.08) 0px 8px 24px -4px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#1c1c1e",
                margin: "0 0 8px",
              }}
            >
              {isEditing ? "재료 수정" : "재료 추가"}
            </h2>
            <p
              style={{ fontSize: "13px", color: "#8e91a0", margin: "0 0 20px" }}
            >
              {isEditing
                ? "재료 정보를 수정합니다. 노트 경계가 애매한 재료는 탑·미들·베이스를 복수 선택할 수 있습니다."
                : "재료명을 한 줄에 하나씩 입력하세요. 노트 경계가 애매한 재료는 탑·미들·베이스를 복수 선택할 수 있습니다."}
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#555a6a",
                    marginBottom: "8px",
                  }}
                >
                  재료 유형 *
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { value: "fragrance" as const, label: "향료" },
                    { value: "carrier" as const, label: "첨가제" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          kind: option.value,
                          note_layers:
                            option.value === "carrier"
                              ? []
                              : p.note_layers.length > 0
                                ? p.note_layers
                                : ["top"],
                          oil_type:
                            option.value === "carrier" ? "" : p.oil_type || "essential",
                        }))
                      }
                      style={{
                        padding: "10px 18px",
                        borderRadius: "9999px",
                        border:
                          form.kind === option.value ? "none" : "1px solid #c7cad5",
                        background:
                          form.kind === option.value ? "#1c1c1e" : "transparent",
                        color:
                          form.kind === option.value ? "#ffffff" : "#555a6a",
                        fontSize: "14px",
                        fontWeight: form.kind === option.value ? 500 : 400,
                        cursor: "pointer",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.kind === "fragrance" && (
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#555a6a",
                      }}
                    >
                      노트 구분 * <span style={{ fontWeight: 400 }}>(복수 선택 가능)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, note_layers: [...NOTE_LAYERS] }))
                      }
                      style={{
                        padding: "6px 12px",
                        borderRadius: "9999px",
                        border: "1px solid #c7cad5",
                        background: "transparent",
                        color: "#555a6a",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      전체 선택
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {NOTE_LAYER_OPTIONS.map((layer) => {
                      const selected = form.note_layers.includes(layer.value);
                      return (
                        <button
                          key={layer.value}
                          type="button"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              note_layers: toggleNoteLayer(p.note_layers, layer.value),
                            }))
                          }
                          style={{
                            padding: "10px 18px",
                            borderRadius: "9999px",
                            border: selected ? "none" : "1px solid #c7cad5",
                            background: selected ? layer.color : "transparent",
                            color: selected ? layer.textColor : "#555a6a",
                            fontSize: "14px",
                            fontWeight: selected ? 600 : 400,
                            cursor: "pointer",
                          }}
                        >
                          {layer.label}
                        </button>
                      );
                    })}
                  </div>
                  {form.note_layers.length > 0 && (
                    <p style={{ fontSize: "12px", color: "#6b6f7e", margin: "8px 0 0" }}>
                      선택됨: {formatNoteLayers(form.note_layers)} 노트
                    </p>
                  )}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                {form.kind === "fragrance" && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#555a6a",
                        marginBottom: "6px",
                      }}
                    >
                      향 프로파일
                      <span
                        style={{
                          fontWeight: 400,
                          color: "#8e91a0",
                          marginLeft: "6px",
                        }}
                      >
                        (선택, 일괄 적용)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.scent_profile}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, scent_profile: e.target.value }))
                      }
                      placeholder="예: 시트러스, 플로럴"
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              {form.kind === "fragrance" && (
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#555a6a",
                      marginBottom: "8px",
                    }}
                  >
                    오일 종류 *
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {OIL_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, oil_type: type.value }))
                        }
                        style={{
                          padding: "10px 18px",
                          borderRadius: "9999px",
                          border:
                            form.oil_type === type.value
                              ? "none"
                              : "1px solid #c7cad5",
                          background:
                            form.oil_type === type.value ? "#1c1c1e" : "transparent",
                          color:
                            form.oil_type === type.value ? "#ffffff" : "#555a6a",
                          fontSize: "14px",
                          fontWeight: form.oil_type === type.value ? 500 : 400,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#555a6a",
                    marginBottom: "6px",
                  }}
                >
                  재료명 *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.namesText}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, namesText: e.target.value }))
                    }
                    placeholder="재료명"
                    required
                    style={inputStyle}
                  />
                ) : (
                  <textarea
                    value={form.namesText}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, namesText: e.target.value }))
                    }
                    placeholder={"베르가못\n로즈\n증류수\nDPG\n올리브 리퀴드"}
                    rows={6}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "1px solid #c7cad5",
                      borderRadius: "10px",
                      background: "#fff",
                      color: "#1c1c1e",
                      outline: "none",
                      fontSize: "16px",
                      resize: "vertical",
                      fontFamily: "inherit",
                      lineHeight: 1.6,
                    }}
                  />
                )}
                {!isEditing && pendingNames.length > 0 && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b6f7e",
                      margin: "8px 0 0",
                    }}
                  >
                    {pendingNames.length}개 재료가 추가됩니다
                  </p>
                )}
              </div>

              {error && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#e53e3e",
                    margin: "-8px 0 16px",
                    padding: "10px 14px",
                    background: "#fff5f5",
                    borderRadius: "8px",
                    border: "1px solid #fed7d7",
                  }}
                >
                  {error}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    color: "#555a6a",
                    border: "1px solid #c7cad5",
                    borderRadius: "9999px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || pendingNames.length === 0}
                  style={{
                    padding: "10px 20px",
                    background:
                      submitting || pendingNames.length === 0
                        ? "#e0e2e8"
                        : "#1c1c1e",
                    color:
                      submitting || pendingNames.length === 0
                        ? "#a5a8b5"
                        : "#ffffff",
                    border: "none",
                    borderRadius: "9999px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor:
                      submitting || pendingNames.length === 0
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {submitting
                    ? isEditing
                      ? "저장 중..."
                      : "추가 중..."
                    : isEditing
                      ? "저장"
                      : pendingNames.length > 1
                        ? `${pendingNames.length}개 재료 추가`
                        : "재료 추가"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="재료 검색..."
          style={{
            height: "40px",
            padding: "0 14px",
            border: "1px solid #e0e2e8",
            borderRadius: "10px",
            background: "#ffffff",
            color: "#1c1c1e",
            outline: "none",
            fontSize: "16px",
            minWidth: "200px",
            flex: 1,
          }}
        />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {FILTER_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              style={{
                height: "36px",
                padding: "0 14px",
                borderRadius: "9999px",
                border:
                  filterCategory === c.value ? "none" : "1px solid #c7cad5",
                background:
                  filterCategory === c.value ? "#1c1c1e" : "transparent",
                color: filterCategory === c.value ? "#ffffff" : "#555a6a",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {c.label}
            </button>
          ))}
          <span
            style={{
              width: "1px",
              height: "20px",
              background: "#e0e2e8",
              margin: "0 2px",
              flexShrink: 0,
            }}
          />
          {OIL_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleOilFilter(type.value)}
              style={{
                height: "36px",
                padding: "0 14px",
                borderRadius: "9999px",
                border:
                  filterOilType === type.value ? "none" : `1px solid #c7cad5`,
                background:
                  filterOilType === type.value ? type.color : "transparent",
                color:
                  filterOilType === type.value ? type.textColor : "#555a6a",
                fontSize: "13px",
                fontWeight: filterOilType === type.value ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {OIL_TYPE_MAP[type.value].label}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#8e91a0" }}>
          불러오는 중...
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #eef0f3",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>⬡</div>
          <p style={{ fontSize: "15px", color: "#8e91a0", margin: 0 }}>
            {searchQuery ? "검색 결과가 없습니다" : "등록된 재료가 없습니다"}
          </p>
          {!searchQuery && (
            <p
              style={{ fontSize: "13px", color: "#a5a8b5", margin: "4px 0 0" }}
            >
              위의 재료 추가 버튼을 눌러 재료를 등록하세요
            </p>
          )}
        </div>
      ) : (
        <LayoutGroup>
          <motion.div
            layout
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredIngredients.map((ingredient, i) => {
                const noteLayers = getNoteLayers(ingredient);
                return (
                  <motion.div
                    key={ingredient.id}
                    layout
                    layoutId={ingredient.id}
                    variants={ingredientCardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    custom={i}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "16px",
                      border: "1px solid #eef0f3",
                      position: "relative",
                      opacity: deletingId === ingredient.id ? 0.5 : 1,
                    }}
                  >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#1c1c1e",
                          marginBottom: "6px",
                        }}
                      >
                        {ingredient.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {ingredient.category === "carrier" ? (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: "9999px",
                              background: CARRIER_BADGE.color,
                              color: CARRIER_BADGE.textColor,
                            }}
                          >
                            {CARRIER_BADGE.label}
                          </span>
                        ) : (
                          noteLayers.map((layer) => (
                            <span
                              key={layer}
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: "9999px",
                                background: NOTE_LAYER_MAP[layer].color,
                                color: NOTE_LAYER_MAP[layer].textColor,
                              }}
                            >
                              {NOTE_LAYER_MAP[layer].label}
                            </span>
                          ))
                        )}
                        {ingredient.oil_type && OIL_TYPE_MAP[ingredient.oil_type] && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: "9999px",
                              background: OIL_TYPE_MAP[ingredient.oil_type].color,
                              color: OIL_TYPE_MAP[ingredient.oil_type].textColor,
                            }}
                          >
                            {OIL_TYPE_MAP[ingredient.oil_type].label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button
                        onClick={() => openEditForm(ingredient)}
                        disabled={deletingId === ingredient.id}
                        title="수정"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          background: "transparent",
                          border: "1px solid #e0e2e8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          color: "#8e91a0",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#eef0f3";
                          e.currentTarget.style.color = "#1c1c1e";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#8e91a0";
                        }}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(ingredient.id)}
                        disabled={deletingId === ingredient.id}
                        title="삭제"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          background: "transparent",
                          border: "1px solid #e0e2e8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          color: "#8e91a0",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fbd4d4";
                          e.currentTarget.style.borderColor = "#fbd4d4";
                          e.currentTarget.style.color = "#c53030";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor = "#e0e2e8";
                          e.currentTarget.style.color = "#8e91a0";
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {ingredient.scent_profile && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b6f7e",
                        margin: "8px 0 0",
                        padding: "6px 10px",
                        background: "#f7f8fa",
                        borderRadius: "8px",
                      }}
                    >
                      {ingredient.scent_profile}
                    </p>
                  )}
                </motion.div>
              );
            })}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}
    </div>
  );
}
