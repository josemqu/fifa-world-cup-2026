"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { COUNTRIES } from "@/utils/countries";
import { ALL_COUNTRIES } from "@/utils/allCountries";
import {
  Loader2,
  UserCircle,
  Globe,
  Trophy,
  Users,
  Calendar,
  X,
} from "lucide-react";
import { clsx } from "clsx";

export function UserProfileModal() {
  const {
    dbUser,
    updateProfile,
    profileComplete,
    loading,
    isProfileModalOpen,
    setProfileModalOpen,
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManuallyClosed, setIsManuallyClosed] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    nickname: "",
    country: "",
    favoriteTeam: "",
    gender: "",
    age: "",
    birthDate: "",
  });

  // Sort countries alphabetically
  const sortedCountries = [...COUNTRIES]
    .filter((c) => c.isoCode)
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    // Open modal if:
    // 1. Manually triggered via context (isProfileModalOpen)
    // 2. OR User is logged in, profile incomplete, and not manually closed in this session
    const shouldOpen =
      isProfileModalOpen ||
      (!loading && dbUser && !profileComplete && !isManuallyClosed);

    if (shouldOpen) {
      setIsOpen(true);

      // Initialize form with existing data
      setFormData({
        displayName: dbUser?.displayName || "",
        nickname: dbUser?.nickname || "",
        country: dbUser?.country || "",
        favoriteTeam: dbUser?.favoriteTeam || "",
        gender: dbUser?.gender || "",
        age: dbUser?.age ? dbUser.age.toString() : "",
        birthDate: dbUser?.birthDate || "",
      });
    } else {
      setIsOpen(false);
    }
  }, [loading, dbUser, profileComplete, isManuallyClosed, isProfileModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setIsManuallyClosed(true);
    setProfileModalOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let calculatedAge = 0;
      if (formData.birthDate) {
        const today = new Date();
        const birthDate = new Date(formData.birthDate);
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
      } else if (formData.age) {
        calculatedAge = parseInt(formData.age);
      }

      await updateProfile({
        displayName: formData.displayName,
        nickname: formData.nickname,
        country: formData.country,
        favoriteTeam: formData.favoriteTeam,
        gender: formData.gender,
        age: calculatedAge,
        birthDate: formData.birthDate,
      });
      handleClose();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Completa tu Perfil
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Para continuar, necesitamos conocerte un poco mejor. Esta
              información aparecerá en tu perfil de jugador.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Nombre Completo
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white"
                placeholder="Tu nombre completo"
              />
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="text-lg leading-none">@</span>
                Apodo / Usuario
              </label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white"
                placeholder="Cómo quieres que te llamen"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Country */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  País de Origen
                </label>
                <select
                  name="country"
                  value={formData.country || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white appearance-none"
                >
                  <option value="">Selecciona tu país...</option>
                  {ALL_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Favorite Team */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Selección Favorita
              </label>
              <select
                name="favoriteTeam"
                value={formData.favoriteTeam || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white appearance-none"
              >
                <option value="">Selecciona tu equipo...</option>
                {sortedCountries.map((country) => (
                  <option key={country.isoCode} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Género
              </label>
              <select
                name="gender"
                value={formData.gender || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white appearance-none"
              >
                <option value="">Selecciona...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
                <option value="Prefiero no decir">Prefiero no decir</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
