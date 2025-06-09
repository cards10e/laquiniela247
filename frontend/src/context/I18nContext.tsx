import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Translation data
const translations = {
  en: {
    common: {
      app_name: "La Quiniela 247",
      loading: "Loading...",
      saving: "Saving...",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      error: "Error",
      success: "Success",
      close: "Close",
      demo_information: "Demo Information",
      demo_environment_notice: "This is a demo environment. All data is for testing purposes only.",
      demo_account_available: "You can also use the demo account"
    },
    auth: {
      login: "Login",
      login_description: "Sign in to your La Quiniela 247 account",
      email: "Email",
      email_placeholder: "Enter your email",
      email_required: "Email is required",
      email_invalid: "Please enter a valid email",
      password: "Password",
      password_placeholder: "Enter your password",
      password_required: "Password is required",
      password_min_length: "Password must be at least 6 characters",
      password_min_length_hint: "Minimum 6 characters",
      remember_me: "Remember me",
      forgot_password: "Forgot password?",
      no_account_register: "Don't have an account? Register",
      login_success: "Login successful!",
      login_error: "Login failed. Please try again.",
      register: "Register",
      register_description: "Create your La Quiniela 247 account",
      first_name: "First Name",
      first_name_placeholder: "Enter your first name",
      first_name_required: "First name is required",
      last_name: "Last Name",
      last_name_placeholder: "Enter your last name",
      last_name_required: "Last name is required",
      confirm_password: "Confirm Password",
      confirm_password_placeholder: "Confirm your password",
      confirm_password_required: "Please confirm your password",
      passwords_dont_match: "Passwords don't match",
      terms_accepted: "I accept the terms and conditions",
      terms_required: "You must accept the terms and conditions",
      newsletter: "I want to receive news and promotions",
      create_account: "Create Account",
      already_have_account: "Already have an account? Sign in",
      registration_success: "Registration successful!",
      registration_error: "Registration failed. Please try again."
    },
    navigation: {
      dashboard: "Dashboard",
      history: "My History",
      games: "Games",
      profile: "Profile",
      logout: "Logout",
      back_to_main: "Back to main site",
      admin_panel: "Admin Panel"
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome, %s!",
      week: "Week",
      performance_overview: "Performance Overview",
      total_bets: "Total Bets",
      correct_percentage: "% Correct",
      ranking_percentile: "Ranking Percentile",
      total_winnings: "Total Winnings",
      current_week: "Current Week",
      open_for_betting: "Open for betting",
      betting_closes_in: "Betting closes in:",
      betting_closed: "Betting closed",
      place_bet: "Place Bet",
      quick_actions: "Quick Actions",
      new_bet: "New Bet",
      place_predictions: "Place your predictions for this week",
      view_history: "View History",
      check_past_bets: "Check your past betting performance",
      profile_settings: "Profile Settings",
      manage_account: "Manage your account settings",
      results: "Results",
      view_results: "View latest results",
      personal_stats: "Personal Stats",
      best_week: "Best Week:",
      best_position: "Best Position:",
      overall_average: "Overall Average:",
      total_won: "Total Won:",
      current_streak: "Current Streak",
      recent_activity: "Recent Activity",
      no_recent_activity: "No recent betting activity",
      start_betting_message: "Start placing bets to see your activity here",
      view_all_history: "View All History",
      place_first_bet: "Place Your First Bet",
      correct: "correct"
    },
    betting: {
      place_bet: "Place Bet",
      select_predictions: "Select Your Predictions",
      home_team: "Home",
      away_team: "Away",
      draw: "Draw",
      bet_amount: "Bet Amount",
      bet_amount_range: "Minimum $10, Maximum $1000",
      bet_summary: "Bet Summary",
      predictions_made: "Predictions Made",
      potential_winnings: "Potential Winnings",
      confirm_bet: "Confirm Bet",
      bet_placed: "Bet placed successfully!",
      bet_failed: "Failed to place bet. Please try again.",
      insufficient_balance: "Insufficient balance",
      select_all_games: "Please select predictions for all games",
      minimum_bet_amount: "Minimum bet amount is $10",
      betting_closed: "Betting Closed",
      betting_closed_message: "Betting for this week has been closed. Please check back next week.",
      deadline_passed: "Deadline has passed",
      single_bets: "Single Bets",
      weekly_parlay: "La Quiniela",
      active_bets: "Active Bets",
      la_quiniela_fixed_amount: "Fixed amount for La Quiniela - All games must be predicted to win $2,000"
    },
    profile: {
      title: "Profile",
      demo_settings: "Demo Settings",
      endless_betting: "Endless Betting Mode",
      endless_betting_description: "Enable this to place unlimited bets on games (demo user only)",
      manage_account_settings: "Manage your account settings and preferences",
      personal_info: "Personal Information",
      account_security: "Account Security",
      notifications: "Notification Preferences",
      performance_stats: "Performance Stats",
      account_settings: "Account Settings",
      betting_preferences: "Betting Preferences",
      save_changes: "Save Changes",
      changes_saved: "Changes saved successfully",
      update_failed: "Failed to update profile",
      profile_not_found: "Profile not found",
      phone: "Phone Number",
      date_of_birth: "Date of Birth",
      country: "Country",
      city: "City",
      email_cannot_be_changed: "Email address cannot be changed",
      change_password: "Change Password",
      current_password: "Current Password",
      current_password_required: "Current password is required",
      new_password: "New Password",
      password_changed: "Password changed successfully",
      password_change_failed: "Failed to change password",
      account_actions: "Account Actions",
      member_since: "Member since",
      logout_all_devices: "Logout from all devices",
      notification_preferences: "Notification Preferences",
      email_notifications: "Email Notifications",
      email_notifications_desc: "Receive updates about your bets and results via email",
      sms_notifications: "SMS Notifications",
      sms_notifications_desc: "Receive important updates via SMS",
      newsletter_desc: "Receive news, promotions, and updates about La Quiniela 247",
      account_summary: "Account Summary",
      account_status: "Account Status",
      active: "Active"
    },
    history: {
      title: "Betting History",
      filter_by: "Filter by",
      all_bets: "All Bets",
      won: "Won",
      lost: "Lost",
      pending: "Pending",
      partial: "Partial",
      date: "Date",
      amount: "Amount",
      accuracy: "Accuracy",
      status: "Status",
      winnings: "Winnings",
      predictions_detail: "Prediction Details",
      your_prediction: "Your prediction",
      actual_result: "Actual result",
      no_bets_yet: "No bets placed yet",
      no_bets_in_filter: "No %s bets found",
      start_betting_message: "Start placing bets to build your history",
      try_different_filter: "Try selecting a different filter to see more results",
      total_bets: "Total Bets",
      total_wagered: "Total Wagered",
      total_winnings: "Total Winnings"
    },
    admin: {
      overview: "Overview",
      users: "Users",
      user_management_tab: "User Management",
      weeks: "Weeks",
      games: "Games",
      game_management: "Game Management",
      manage_platform: "Manage the La Quiniela 247 platform",
      total_users: "Total Users",
      active_users: "Active Users",
      total_bets: "Total Bets",
      total_revenue: "Total Revenue",
      recent_activity: "Recent Activity",
      current_week_bets: "Current Week Bets",
      user_activity_rate: "User Activity Rate",
      user_management: "User Management",
      user: "User",
      role: "Role",
      total_winnings: "Total Winnings",
      status: "Status",
      actions: "Actions",
      active: "Active",
      inactive: "Inactive",
      activate: "Activate",
      deactivate: "Deactivate",
      create_week: "Create Week",
      week_number: "Week Number",
      betting_deadline: "Betting Deadline",
      start_date: "Start Date",
      end_date: "End Date",
      existing_weeks: "Existing Weeks",
      week_created: "Week created successfully",
      week_creation_failed: "Failed to create week",
      open: "Open",
      closed: "Closed",
      completed: "Completed",
      create_game: "Create Game",
      week: "Week",
      select_week: "Select a week",
      select_team: "Select a team",
      game_date: "Game Date",
      home_team: "Home Team",
      away_team: "Away Team",
      existing_games: "Existing Games",
      game_created: "Game created successfully",
      game_creation_failed: "Failed to create game",
      scheduled: "Scheduled",
      live: "Live",
      home_score: "Home Score",
      away_score: "Away Score",
      update_result: "Update Result",
      final_score: "Final Score",
      game_result_updated: "Game result updated successfully",
      game_result_update_failed: "Failed to update game result",
      user_status_updated: "User status updated successfully",
      user_status_update_failed: "Failed to update user status",
      no_games_message: "No games currently scheduled. Please create a game above.",
      open_betting: "Open Betting for This Week",
      choose_betting_deadline: "Choose Betting Deadline",
      hours_before_game: "%{hours} Hours before game start",
      cancel: "Cancel",
      delete_game: "Delete",
      delete_game_confirm: "Are you sure you want to delete this game?",
      game_deleted: "Game deleted",
      game_delete_failed: "Failed to delete game",
      betting_open: "Betting Open",
      game_start: "Game Start",
      vs: "vs",
      tbd: "TBD",
      week_set_current: "Week set as current and deadline updated!",
      no_games_for_week: "No games found for this week."
    },
    themes: {
      light: "Light Mode",
      dark: "Dark Mode",
      auto: "Auto (System)",
      toggle_theme: "Toggle theme"
    },
    languages: {
      english: "English",
      spanish: "Español",
      switch_language: "Switch language"
    }
  },
  es: {
    common: {
      app_name: "La Quiniela 247",
      loading: "Cargando...",
      saving: "Guardando...",
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      confirm: "Confirmar",
      yes: "Sí",
      no: "No",
      error: "Error",
      success: "Éxito",
      close: "Cerrar",
      demo_information: "Información de Demo",
      demo_environment_notice: "Este es un entorno de demostración. Todos los datos son solo para pruebas.",
      demo_account_available: "También puedes usar la cuenta de demo"
    },
    auth: {
      login: "Iniciar Sesión",
      login_description: "Inicia sesión en tu cuenta de La Quiniela 247",
      email: "Correo Electrónico",
      email_placeholder: "Ingresa tu correo electrónico",
      email_required: "El correo electrónico es requerido",
      email_invalid: "Por favor ingresa un correo válido",
      password: "Contraseña",
      password_placeholder: "Ingresa tu contraseña",
      password_required: "La contraseña es requerida",
      password_min_length: "La contraseña debe tener al menos 6 caracteres",
      password_min_length_hint: "Mínimo 6 caracteres",
      remember_me: "Recordarme",
      forgot_password: "¿Olvidaste tu contraseña?",
      no_account_register: "¿No tienes cuenta? Regístrate",
      login_success: "¡Inicio de sesión exitoso!",
      login_error: "Error al iniciar sesión. Inténtalo de nuevo.",
      register: "Registrarse",
      register_description: "Crea tu cuenta de La Quiniela 247",
      first_name: "Nombre",
      first_name_placeholder: "Ingresa tu nombre",
      first_name_required: "El nombre es requerido",
      last_name: "Apellido",
      last_name_placeholder: "Ingresa tu apellido",
      last_name_required: "El apellido es requerido",
      confirm_password: "Confirmar Contraseña",
      confirm_password_placeholder: "Confirma tu contraseña",
      confirm_password_required: "Por favor confirma tu contraseña",
      passwords_dont_match: "Las contraseñas no coinciden",
      terms_accepted: "Acepto los términos y condiciones",
      terms_required: "Debes aceptar los términos y condiciones",
      newsletter: "Quiero recibir noticias y promociones",
      create_account: "Crear Cuenta",
      already_have_account: "¿Ya tienes cuenta? Inicia sesión",
      registration_success: "¡Registro exitoso!",
      registration_error: "Error en el registro. Inténtalo de nuevo."
    },
    navigation: {
      dashboard: "Panel",
      history: "Mi Historial",
      games: "Juegos",
      profile: "Perfil",
      logout: "Salir",
      back_to_main: "Volver al sitio principal",
      admin_panel: "Panel de Admin"
    },
    dashboard: {
      title: "Panel",
      welcome: "¡Bienvenido, %s!",
      week: "Jornada",
      performance_overview: "Resumen de Rendimiento",
      total_bets: "Apuestas Totales",
      correct_percentage: "% Correctas",
      ranking_percentile: "Ranking Percentil",
      total_winnings: "Ganancias Totales",
      current_week: "Jornada Actual",
      open_for_betting: "Abierta para apuestas",
      betting_closes_in: "Cierre de apuestas en:",
      betting_closed: "Apuestas cerradas",
      place_bet: "Apostar",
      quick_actions: "Acciones Rápidas",
      new_bet: "Nueva Apuesta",
      place_predictions: "Realiza tus predicciones para esta jornada",
      view_history: "Ver Historial",
      check_past_bets: "Revisa tu rendimiento en apuestas pasadas",
      profile_settings: "Configuración de Perfil",
      manage_account: "Administra la configuración de tu cuenta",
      results: "Resultados",
      view_results: "Ver últimos resultados",
      personal_stats: "Estadísticas Personales",
      best_week: "Mejor Jornada:",
      best_position: "Mejor Posición:",
      overall_average: "Promedio General:",
      total_won: "Total Ganado:",
      current_streak: "Racha Actual",
      recent_activity: "Actividad Reciente",
      no_recent_activity: "No hay actividad de apuestas reciente",
      start_betting_message: "Comienza a apostar para ver tu actividad aquí",
      view_all_history: "Ver Todo el Historial",
      place_first_bet: "Realiza tu Primera Apuesta",
      correct: "correctas"
    },
    betting: {
      place_bet: "Apostar",
      select_predictions: "Selecciona tus Predicciones",
      home_team: "Local",
      away_team: "Visitante",
      draw: "Empate",
      bet_amount: "Cantidad de Apuesta",
      bet_amount_range: "Mínimo $10, Máximo $1000",
      bet_summary: "Resumen de Apuesta",
      predictions_made: "Predicciones Realizadas",
      potential_winnings: "Ganancias Potenciales",
      confirm_bet: "Confirmar Apuesta",
      bet_placed: "¡Apuesta realizada con éxito!",
      bet_failed: "Error al realizar la apuesta. Inténtalo de nuevo.",
      insufficient_balance: "Saldo insuficiente",
      select_all_games: "Por favor selecciona predicciones para todos los juegos",
      minimum_bet_amount: "La cantidad mínima de apuesta es $10",
      betting_closed: "Apuestas Cerradas",
      betting_closed_message: "Las apuestas para esta jornada han sido cerradas. Por favor regresa la próxima semana.",
      deadline_passed: "La fecha límite ha pasado",
      single_bets: "Apuestas Simples",
      weekly_parlay: "La Quiniela",
      active_bets: "Apuestas Activas",
      la_quiniela_fixed_amount: "Cantidad fija para La Quiniela - Todos los juegos deben predecirse para ganar $2,000"
    },
    profile: {
      title: "Perfil",
      demo_settings: "Configuración de Demo",
      endless_betting: "Modo de Apuestas Infinitas",
      endless_betting_description: "Activa esto para realizar apuestas ilimitadas en los juegos (solo usuario demo)",
      manage_account_settings: "Administra la configuración y preferencias de tu cuenta",
      personal_info: "Información Personal",
      account_security: "Seguridad de la Cuenta",
      notifications: "Preferencias de Notificaciones",
      performance_stats: "Estadísticas de Rendimiento",
      account_settings: "Configuración de Cuenta",
      betting_preferences: "Preferencias de Apuestas",
      save_changes: "Guardar Cambios",
      changes_saved: "Cambios guardados exitosamente",
      update_failed: "Error al actualizar el perfil",
      profile_not_found: "Perfil no encontrado",
      phone: "Número de Teléfono",
      date_of_birth: "Fecha de Nacimiento",
      country: "País",
      city: "Ciudad",
      email_cannot_be_changed: "La dirección de correo no se puede cambiar",
      change_password: "Cambiar Contraseña",
      current_password: "Contraseña Actual",
      current_password_required: "La contraseña actual es requerida",
      new_password: "Nueva Contraseña",
      password_changed: "Contraseña cambiada exitosamente",
      password_change_failed: "Error al cambiar la contraseña",
      account_actions: "Acciones de Cuenta",
      member_since: "Miembro desde",
      logout_all_devices: "Cerrar sesión en todos los dispositivos",
      notification_preferences: "Preferencias de Notificaciones",
      email_notifications: "Notificaciones por Email",
      email_notifications_desc: "Recibe actualizaciones sobre tus apuestas y resultados por email",
      sms_notifications: "Notificaciones por SMS",
      sms_notifications_desc: "Recibe actualizaciones importantes por SMS",
      newsletter_desc: "Recibe noticias, promociones y actualizaciones sobre La Quiniela 247",
      account_summary: "Resumen de Cuenta",
      account_status: "Estado de Cuenta",
      active: "Activa"
    },
    history: {
      title: "Historial de Apuestas",
      filter_by: "Filtrar por",
      all_bets: "Todas las Apuestas",
      won: "Ganadas",
      lost: "Perdidas",
      pending: "Pendientes",
      partial: "Parciales",
      date: "Fecha",
      amount: "Cantidad",
      accuracy: "Precisión",
      status: "Estado",
      winnings: "Ganancias",
      predictions_detail: "Detalles de Predicciones",
      your_prediction: "Tu predicción",
      actual_result: "Resultado real",
      no_bets_yet: "Aún no has realizado apuestas",
      no_bets_in_filter: "No se encontraron apuestas %s",
      start_betting_message: "Comienza a apostar para construir tu historial",
      try_different_filter: "Intenta seleccionar un filtro diferente para ver más resultados",
      total_bets: "Total de Apuestas",
      total_wagered: "Total Apostado",
      total_winnings: "Ganancias Totales"
    },
    admin: {
      overview: "Resumen",
      users: "Usuarios",
      user_management_tab: "Gestión de Usuarios",
      weeks: "Jornadas",
      games: "Juegos",
      game_management: "Gestión de Juegos",
      manage_platform: "Administra la plataforma La Quiniela 247",
      total_users: "Total de Usuarios",
      active_users: "Usuarios Activos",
      total_bets: "Total de Apuestas",
      total_revenue: "Ingresos Totales",
      recent_activity: "Actividad Reciente",
      current_week_bets: "Apuestas de la Jornada Actual",
      user_activity_rate: "Tasa de Actividad de Usuarios",
      user_management: "Gestión de Usuarios",
      user: "Usuario",
      role: "Rol",
      total_winnings: "Ganancias Totales",
      status: "Estado",
      actions: "Acciones",
      active: "Activo",
      inactive: "Inactivo",
      activate: "Activar",
      deactivate: "Desactivar",
      create_week: "Crear Jornada",
      week_number: "Número de Jornada",
      betting_deadline: "Fecha Límite de Apuestas",
      start_date: "Fecha de Inicio",
      end_date: "Fecha de Fin",
      existing_weeks: "Jornadas Existentes",
      week_created: "Jornada creada exitosamente",
      week_creation_failed: "Error al crear la jornada",
      open: "Abierta",
      closed: "Cerrada",
      completed: "Completada",
      create_game: "Crear Juego",
      week: "Jornada",
      select_week: "Selecciona una jornada",
      select_team: "Selecciona un equipo",
      game_date: "Fecha del Juego",
      home_team: "Equipo Local",
      away_team: "Equipo Visitante",
      existing_games: "Juegos Existentes",
      game_created: "Juego creado exitosamente",
      game_creation_failed: "Error al crear el juego",
      scheduled: "Programado",
      live: "En Vivo",
      home_score: "Marcador Local",
      away_score: "Marcador Visitante",
      update_result: "Actualizar Resultado",
      final_score: "Marcador Final",
      game_result_updated: "Resultado del juego actualizado exitosamente",
      game_result_update_failed: "Error al actualizar el resultado del juego",
      user_status_updated: "Estado del usuario actualizado exitosamente",
      user_status_update_failed: "Error al actualizar el estado del usuario",
      no_games_message: "No hay juegos programados actualmente. Por favor, crea un juego arriba.",
      open_betting: "Abrir Apuestas para Esta Jornada",
      choose_betting_deadline: "Elegir Fecha Límite de Apuestas",
      hours_before_game: "%{hours} Horas antes del inicio del juego",
      cancel: "Cancelar",
      delete_game: "Eliminar",
      delete_game_confirm: "¿Estás seguro de que quieres eliminar este juego?",
      game_deleted: "Juego eliminado",
      game_delete_failed: "Error al eliminar el juego",
      betting_open: "Apuestas Abiertas",
      game_start: "Inicio del Juego",
      vs: "vs",
      tbd: "Pendiente",
      week_set_current: "¡Jornada establecida como actual y fecha límite actualizada!",
      no_games_for_week: "No se encontraron juegos para esta jornada."
    },
    themes: {
      light: "Modo Claro",
      dark: "Modo Oscuro",
      auto: "Auto (Sistema)",
      toggle_theme: "Cambiar tema"
    },
    languages: {
      english: "English",
      spanish: "Español",
      switch_language: "Cambiar idioma"
    }
  }
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('es');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('lq247_language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('lq247_language', language);
  }, [language]);

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found in current language
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in either language
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace named parameters in the string
    if (params) {
      return value.replace(/%{(\w+)}/g, (match, paramName) => {
        return params[paramName] !== undefined ? String(params[paramName]) : match;
      });
    }

    return value;
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    t
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}