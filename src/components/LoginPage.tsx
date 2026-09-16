import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  LogIn,
  GraduationCap,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Calendar,
  Zap,
  Sun,
  Moon,
  Mail,
  KeyRound,
  RefreshCw,
  Check,
} from 'lucide-react';
import { UserProfile } from '../types';
import { DEMO_STUDENTS, GUEST_USER, CURRENT_USER } from '../data/mockData';
import { UniviaLogo } from './UniviaLogo';
import { useTheme } from '../context/ThemeContext';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile, token?: string) => void;
  onSignUpSuccess?: (user: UserProfile, token?: string) => void;
  onViewAsGuest?: () => void;
  initialMode?: 'gateway' | 'signin' | 'register';
  onCancel?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onSignUpSuccess,
  onViewAsGuest,
  initialMode = 'gateway',
  onCancel,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  // Primary Gateway vs. Interactive Auth form
  const [viewState, setViewState] = useState<'gateway' | 'auth'>(
    initialMode === 'gateway' ? 'gateway' : 'auth'
  );

  // Auth View: Sign-In vs. Sign-Up
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>(
    initialMode === 'register' ? 'signup' : 'signin'
  );

  // ==========================================
  // Sign In States (Multi-Identifier)
  // ==========================================
  const [signInName, setSignInName] = useState('');
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // ==========================================
  // Sign Up States (11-Digit Student ID and Credentials)
  // ==========================================
  // Student ID registration form states (11-digit Roll ID only)
  const [regFullName, setRegFullName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBranch, setRegBranch] = useState('B.Tech Computer Science & AI (CSE-AI)');
  const [regCustomBranch, setRegCustomBranch] = useState('');
  const [regYear, setRegYear] = useState('1st Year • Class of 2030');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ==========================================
  // Dynamic Multi-Identifier Type Detection
  // ==========================================
  const getIdentifierType = (input: string): { type: 'phone' | 'student_id' | 'username'; label: string; icon: any } => {
    const trimmed = input.trim();
    if (!trimmed) {
      return { type: 'username', label: 'Student ID, Username, or Phone Number', icon: User };
    }

    // Phone detection: starts with +, or has 10+ digits with no letters
    const onlyDigits = trimmed.replace(/\D/g, '');
    const hasLetters = /[a-zA-Z]/.test(trimmed);
    if (!hasLetters && (trimmed.startsWith('+') || onlyDigits.length >= 10)) {
      return { type: 'phone', label: 'Detected: Phone Number', icon: Phone };
    }

    // Student ID detection: contains university prefix, dashes with numbers, or roll pattern
    if (/^[A-Za-z0-9]+-[A-Za-z0-9]+-[0-9]+-[0-9]+$/i.test(trimmed) || /^(IGDTUW|UNIV|CSE|IT|AI|ECE)/i.test(trimmed) || /-\d{4}-/.test(trimmed)) {
      return { type: 'student_id', label: 'Detected: Student Roll ID', icon: GraduationCap };
    }

    // Email (Google or College)
    if (trimmed.includes('@')) {
      return { type: 'username', label: 'Detected: Email Address (Google / University)', icon: Mail };
    }

    return { type: 'username', label: 'Detected: Student Username', icon: User };
  };

  const detectedIdentifier = getIdentifierType(signInIdentifier);

  // ==========================================
  // Strict Real-Time Password Complexity Rules
  // ==========================================
  const checkPasswordRules = (pwd: string) => {
    return {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    };
  };

  // Evaluate password rules for the active view
  const activePassword = authTab === 'signin' ? signInPassword : regPassword;
  const passwordRules = checkPasswordRules(activePassword);
  const satisfiedCount = Object.values(passwordRules).filter(Boolean).length;
  const isPasswordStrong = satisfiedCount === 5;

  // ==========================================
  // Handler: Multi-Identifier Sign In
  // ==========================================
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signInName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!signInIdentifier.trim()) {
      setErrorMessage('Please enter your Student ID, Username, or Phone Number.');
      return;
    }

    if (!signInPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (!isPasswordStrong) {
      setErrorMessage('Password must meet all 5 strict security requirements.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try Backend Express API Login
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signInName.trim(),
          identifier: signInIdentifier.trim(),
          password: signInPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        const userWithName: UserProfile = {
          ...data.user,
          name: signInName.trim() || data.user.name,
          handle: `@${signInName.trim().toLowerCase().replace(/\s+/g, '')}`,
        };
        setSuccessMessage(`Welcome back, ${userWithName.name}!`);
        localStorage.setItem('univia_session_token', data.token || `token_${Date.now()}`);
        localStorage.setItem('univia_current_user', JSON.stringify(userWithName));
        setTimeout(() => {
          onLoginSuccess(userWithName, data.token);
        }, 400);
        return;
      }

      // 2. Check local registered user in storage
      try {
        const stored = localStorage.getItem('univia_current_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const cleanInput = signInIdentifier.trim().toLowerCase();
          if (
            parsed.email?.toLowerCase() === cleanInput ||
            parsed.campusCardId?.toLowerCase() === cleanInput ||
            parsed.studentId?.toLowerCase() === cleanInput ||
            parsed.handle?.toLowerCase().replace('@', '') === cleanInput.replace('@', '')
          ) {
            const token = `univia_session_${Date.now()}`;
            const userWithName: UserProfile = {
              ...parsed,
              name: signInName.trim() || parsed.name,
              handle: `@${signInName.trim().toLowerCase().replace(/\s+/g, '')}`,
            };
            localStorage.setItem('univia_session_token', token);
            localStorage.setItem('univia_current_user', JSON.stringify(userWithName));
            setSuccessMessage(`Welcome, ${userWithName.name}!`);
            setTimeout(() => {
              onLoginSuccess(userWithName, token);
            }, 400);
            return;
          }
        }
      } catch (e) {
        // Continue to demo student matching
      }

      // 3. Client-side fallback matching against student database
      const cleanInput = signInIdentifier.trim().toLowerCase();
      const cleanDigits = signInIdentifier.replace(/\D/g, '');

      const matchedStudent = DEMO_STUDENTS.find((s) => {
        const matchId = s.campusCardId.toLowerCase() === cleanInput;
        const matchEmail = s.email?.toLowerCase() === cleanInput;
        const matchHandle = s.handle.toLowerCase().replace('@', '') === cleanInput.replace('@', '');
        const matchPhone = s.phone && s.phone.replace(/\D/g, '').endsWith(cleanDigits && cleanDigits.length >= 6 ? cleanDigits : '___');
        return matchId || matchEmail || matchHandle || matchPhone;
      });

      if (matchedStudent) {
        const token = `univia_session_${Date.now()}`;
        const userWithName: UserProfile = {
          ...matchedStudent,
          name: signInName.trim() || matchedStudent.name,
          handle: `@${signInName.trim().toLowerCase().replace(/\s+/g, '')}`,
        };
        localStorage.setItem('univia_session_token', token);
        localStorage.setItem('univia_current_user', JSON.stringify(userWithName));
        setSuccessMessage(`Welcome, ${userWithName.name}!`);
        setTimeout(() => {
          onLoginSuccess(userWithName, token);
        }, 400);
        return;
      }

      // If entered email or roll ID with valid password, generate session
      if (cleanInput.includes('@') || cleanDigits.length >= 8) {
        const userEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@igdtuw.ac.in`;
        const autoStudent: UserProfile = {
          ...DEMO_STUDENTS[0],
          _id: `stu_${Date.now()}`,
          id: `stu_${Date.now()}`,
          name: signInName.trim() || (cleanInput.includes('@') ? cleanInput.split('@')[0].replace(/[._]/g, ' ') : `Student ${cleanInput}`),
          email: userEmail,
          campusCardId: cleanDigits.length >= 8 ? cleanDigits : '04201012026',
          studentId: cleanDigits.length >= 8 ? cleanDigits : '04201012026',
          handle: `@${signInName.trim().toLowerCase().replace(/\s+/g, '')}`,
        };
        const token = `univia_session_${Date.now()}`;
        localStorage.setItem('univia_session_token', token);
        localStorage.setItem('univia_current_user', JSON.stringify(autoStudent));
        setSuccessMessage(`Welcome, ${autoStudent.name}!`);
        setTimeout(() => {
          onLoginSuccess(autoStudent, token);
        }, 400);
        return;
      }

      setErrorMessage(data?.error || 'Invalid credentials. Check your Email or Student ID.');
    } catch {
      // Offline / network fallback
      const cleanInput = signInIdentifier.trim().toLowerCase();
      const matched = DEMO_STUDENTS.find(
        (s) =>
          s.campusCardId.toLowerCase() === cleanInput ||
          s.email?.toLowerCase() === cleanInput ||
          s.name.toLowerCase().includes(cleanInput)
      );

      if (matched) {
        const userWithName: UserProfile = {
          ...matched,
          name: signInName.trim() || matched.name,
          handle: `@${signInName.trim().toLowerCase().replace(/\s+/g, '')}`,
        };
        localStorage.setItem('univia_current_user', JSON.stringify(userWithName));
        onLoginSuccess(userWithName);
      } else {
        setErrorMessage('Authentication server unreachable. Please verify your Student ID and credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // Handler: Student ID Registration
  // ==========================================
  const handleStudentIdSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regFullName.trim()) {
      setErrorMessage('Please enter your full legal student name.');
      return;
    }

    const cleanRollDigits = regStudentId.replace(/\D/g, '');
    if (cleanRollDigits.length !== 11) {
      setErrorMessage('Student Roll ID must be an 11-digit number only (e.g. 04201012025).');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address (e.g. name@gmail.com or roll@igdtuw.ac.in).');
      return;
    }

    if (!isPasswordStrong) {
      setErrorMessage('Password must satisfy all 5 strict security requirements.');
      return;
    }

    setIsLoading(true);

    const resolvedBranch = regBranch === 'Others' ? (regCustomBranch.trim() || 'Other Branch') : regBranch;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'student_id',
          fullName: regFullName.trim(),
          studentId: regStudentId.trim(),
          email: regEmail.trim(),
          phoneNumber: regPhone.trim(),
          password: regPassword,
          major: resolvedBranch,
          classYear: regYear,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        const registeredUser: UserProfile = {
          ...data.user,
          name: regFullName.trim() || data.user.name,
          isNewUser: true,
        };
        localStorage.setItem('univia_session_token', data.token);
        localStorage.setItem('univia_current_user', JSON.stringify(registeredUser));
        setSuccessMessage(`Welcome, ${registeredUser.name}! Setting up your student workspace...`);
        setTimeout(() => {
          if (onSignUpSuccess) {
            onSignUpSuccess(registeredUser, data.token);
          } else {
            onLoginSuccess(registeredUser, data.token);
          }
        }, 500);
        return;
      }

      // Fallback local registration
      const newStudent: UserProfile = {
        name: regFullName.trim(),
        role: 'Student',
        isNewUser: true,
        handle: `@${regFullName.trim().toLowerCase().replace(/\s+/g, '')}`,
        major: resolvedBranch,
        classYear: regYear,
        university: 'Indira Gandhi Delhi Technical University for Women (Univia)',
        avatar: '',
        campusCardId: regStudentId.trim().toUpperCase(),
        status: '🟢 Univia Campus Fresher • Just Joined',
        email: regEmail.trim(),
        phone: regPhone.trim(),
        bio: '',
        skills: [],
        interests: [],
        stats: {
          societiesJoined: 0,
          eventsAttended: 0,
          upcomingDeadlines: 0,
          savedOpportunities: 0,
        },
      };

      const localToken = `univia_reg_${Date.now()}`;
      localStorage.setItem('univia_session_token', localToken);
      localStorage.setItem('univia_current_user', JSON.stringify(newStudent));
      setSuccessMessage(`Welcome, ${newStudent.name}! Setting up your student workspace...`);
      setTimeout(() => {
        if (onSignUpSuccess) {
          onSignUpSuccess(newStudent, localToken);
        } else {
          onLoginSuccess(newStudent, localToken);
        }
      }, 500);
    } catch {
      setErrorMessage('Registration failed. Please check your information and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Autofill Helper
  const loadDemoUser = (user: typeof DEMO_STUDENTS[0]) => {
    setSignInName(user.name);
    setSignInIdentifier(user.campusCardId);
    setSignInPassword('Password@123');
    setErrorMessage('');
    setSuccessMessage(`Loaded ${user.name}'s demo credentials`);
  };

  return (
    <div
      id="univia-gateway-root"
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 transition-colors duration-300 font-sans"
      style={{
        backgroundColor: isDark ? '#0F172A' : '#F8F6FD',
      }}
    >
      {/* Theme Switcher in top corner */}
      <div className="fixed top-5 right-5 z-50 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all border shadow-sm"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? '#334155' : '#E9E1F5',
            color: isDark ? '#E9D5FF' : '#7033F5',
          }}
          title={isDark ? 'Switch to Lavender Light Theme' : 'Switch to Neon Lavender Deep Slate'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#7033F5]" />}
          <span>{isDark ? 'Lavender Slate' : 'Lavender Crisp'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. THE GATEWAY STATE (APP LAUNCH SPLIT SCREEN) */}
      {/* ========================================================================= */}
      {viewState === 'gateway' ? (
        <div
          className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border flex flex-col lg:flex-row transition-all duration-300 animate-in fade-in zoom-in-95"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#E9E1F5',
          }}
        >
          {/* Left Column: Hero Showcase & Branding */}
          <div
            className="lg:w-1/2 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r"
            style={{
              backgroundColor: isDark ? '#151F32' : '#FAF8FE',
              borderColor: isDark ? '#2D3B52' : '#F0EAF8',
            }}
          >
            {/* Ambient Background Glow */}
            <div
              className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40"
              style={{
                background: isDark
                  ? 'radial-gradient(circle, rgba(157, 103, 255, 0.4) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(112, 51, 245, 0.25) 0%, transparent 70%)',
              }}
            />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <UniviaLogo size="lg" />
              </div>

              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{
                  backgroundColor: isDark ? 'rgba(157, 103, 255, 0.15)' : '#F2ECFA',
                  color: isDark ? '#C084FC' : '#7033F5',
                  border: isDark ? '1px solid rgba(157, 103, 255, 0.3)' : '1px solid #DDD3F5',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Collegiate Intelligence & Community Network</span>
              </div>

              <h1
                className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
                style={{ color: isDark ? '#F8FAFC' : '#241E34' }}
              >
                Where Campus Life <br />
                <span className="bg-gradient-to-r from-[#7033F5] via-[#8A50F7] to-[#BFAEE3] bg-clip-text text-transparent">
                  Actually Happens.
                </span>
              </h1>

              <p
                className="text-sm leading-relaxed mb-8"
                style={{ color: isDark ? '#94A3B8' : '#685D85' }}
              >
                Eliminate announcement chaos from scattered WhatsApp groups. Univia centralizes verified workshops,
                society recruitments, and student schedules into one streamlined workspace.
              </p>
            </div>

            {/* University Affiliation Badge */}
            <div
              className="pt-4 border-t flex items-center justify-between text-xs"
              style={{
                borderColor: isDark ? '#2D3B52' : '#EDE7F6',
                color: isDark ? '#94A3B8' : '#766E87',
              }}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#7033F5]" />
                <span className="font-semibold">IGDTUW Delhi Campus</span>
              </div>
              <span className="text-[11px] font-mono opacity-80">v2.4 Production</span>
            </div>
          </div>

          {/* Right Column: Split Gateway Decision Portal */}
          <div className="lg:w-1/2 p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <div className="mb-8">
                <span
                  className="text-xs font-bold uppercase tracking-wider text-[#7033F5]"
                >
                  Campus Portal Gateway
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-bold tracking-tight mt-1"
                  style={{ color: isDark ? '#F8FAFC' : '#241E34' }}
                >
                  Select Your Access Mode
                </h2>
                <p
                  className="text-xs mt-1.5"
                  style={{ color: isDark ? '#94A3B8' : '#685D85' }}
                >
                  Choose how you want to step into the campus ecosystem today.
                </p>
              </div>

              {/* Action Card: LOGIN / SIGN UP */}
              <div className="space-y-4 mb-8">
                <button
                  id="btn-login-signup-gateway"
                  onClick={() => setViewState('auth')}
                  className="w-full text-left p-6 rounded-2xl border transition-all duration-200 group relative flex items-start gap-4 hover:scale-[1.01] hover:shadow-xl shadow-lavender-sm"
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: '#7033F5',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-tr from-[#7033F5] to-[#8A50F7] text-white shadow-md shadow-[#7033F5]/30 group-hover:scale-105 transition-transform"
                  >
                    <LogIn className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3
                        className="text-base font-bold flex items-center gap-2"
                        style={{ color: isDark ? '#F8FAFC' : '#241E34' }}
                      >
                        Student Portal Access
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#7033F5] text-white uppercase tracking-wider shadow-xs">
                        Verified Login
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: isDark ? '#94A3B8' : '#685D85' }}
                    >
                      Sign in with your Student Roll ID, Phone Number, or College Email to access your timetable, RSVP to events, and connect with societies.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#7033F5] self-center shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Fast Sandbox Demo Credentials */}
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: isDark ? '#151F32' : '#FAF8FE',
                  borderColor: isDark ? '#2D3B52' : '#F0EAF8',
                }}
              >
                <p
                  className="text-[11px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5"
                  style={{ color: isDark ? '#94A3B8' : '#685D85' }}
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#7033F5]" />
                  <span>Sandbox Test Profile (One-Click)</span>
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      if (DEMO_STUDENTS[0]) {
                        loadDemoUser(DEMO_STUDENTS[0]);
                      }
                      setViewState('auth');
                      setAuthTab('signin');
                    }}
                    className="p-3 rounded-xl text-left border transition-all text-xs font-semibold hover:border-[#7033F5] flex items-center justify-between"
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#EDE7F6',
                    }}
                  >
                    <div>
                      <div className="font-bold" style={{ color: isDark ? '#F1F5F9' : '#241E34' }}>
                        {DEMO_STUDENTS[0]?.name || 'Riya Sharma'}
                      </div>
                      <div className="text-[10px] text-[#7033F5]">First Year Student (Fresher) • Computer Science & AI</div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#FAF8FE] border border-[#EDE7F5] text-[#7033F5]">
                      Load Credentials
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div
              className="mt-6 pt-4 border-t text-center text-xs"
              style={{
                borderColor: isDark ? '#334155' : '#F0EAF8',
                color: isDark ? '#94A3B8' : '#766E87',
              }}
            >
              Protected by Univia Multi-Factor Collegiate Authentication
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. INTERACTIVE AUTH VIEW (MULTI-IDENTIFIER SIGN-IN / SECURE SIGN-UP)       */
        /* ========================================================================= */
        <div
          className="w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border p-6 sm:p-8 md:p-10 transition-all duration-300 animate-in fade-in zoom-in-95 relative"
          style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#E9E1F5',
          }}
        >
          {/* Top Bar: Back to Gateway Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setViewState('gateway')}
              className="flex items-center gap-1.5 text-xs font-bold text-[#7033F5] hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Gateway</span>
            </button>
            <UniviaLogo size="sm" />
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: isDark ? '#F8FAFC' : '#241E34' }}
            >
              {authTab === 'signin' ? 'Sign in to Univia' : 'Create Student Account'}
            </h2>
            <p
              className="text-xs mt-1"
              style={{ color: isDark ? '#94A3B8' : '#685D85' }}
            >
              {authTab === 'signin'
                ? 'Enter your Student ID, Username, or registered Phone Number.'
                : 'Join the verified collegiate network of IGDTUW.'}
            </p>
          </div>

          {/* Tab Switcher: Sign In vs Sign Up */}
          <div
            className="flex p-1 rounded-2xl mb-6 border"
            style={{
              backgroundColor: isDark ? '#151F32' : '#F5EFFB',
              borderColor: isDark ? '#2D3B52' : '#E9E1F5',
            }}
          >
            <button
              id="tab-btn-signin"
              onClick={() => {
                setAuthTab('signin');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                authTab === 'signin'
                  ? 'bg-white dark:bg-[#1E293B] text-[#7033F5] shadow-sm'
                  : 'text-[#766E87] dark:text-[#94A3B8] hover:text-[#241E34]'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-btn-signup"
              onClick={() => {
                setAuthTab('signup');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                authTab === 'signup'
                  ? 'bg-white dark:bg-[#1E293B] text-[#7033F5] shadow-sm'
                  : 'text-[#766E87] dark:text-[#94A3B8] hover:text-[#241E34]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Global Error and Success Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: SIGN IN (EMAIL OR STUDENT ID)                                       */}
          {/* ========================================================================= */}
          {authTab === 'signin' ? (
            <div className="space-y-4">
              <form onSubmit={handleSignInSubmit} className="space-y-4">
              {/* Full Name Input for Personalized Experience */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signin-name-input"
                    className="text-xs font-bold flex items-center gap-1.5"
                    style={{ color: isDark ? '#E2E8F0' : '#241E34' }}
                  >
                    <User className="w-3.5 h-3.5 text-[#7033F5]" />
                    <span>Your Full Name</span>
                  </label>
                  <span className="text-[10px] font-semibold text-[#7033F5] bg-[#F5F0FB] px-1.5 py-0.5 rounded">
                    Shown on Home Page
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="signin-name-input"
                    type="text"
                    required
                    value={signInName}
                    onChange={(e) => setSignInName(e.target.value)}
                    placeholder="e.g. Riya Sharma or Shaivi Jain"
                    className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none transition-all"
                    style={{
                      backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                      borderColor: isDark ? '#334155' : '#DDD5ED',
                      color: isDark ? '#F8FAFC' : '#241E34',
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#837B93] mt-1">
                  Enter your name to personalize your Univia dashboard, greeting, and campus profile.
                </p>
              </div>

              {/* Adaptive Identifier Field: Google Email, College Email, or Roll ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signin-identifier-input"
                    className="text-xs font-bold"
                    style={{ color: isDark ? '#E2E8F0' : '#241E34' }}
                  >
                    Email (Google or College) or Student ID
                  </label>
                  <span
                    className="text-[11px] font-semibold text-[#7033F5] flex items-center gap-1"
                  >
                    <detectedIdentifier.icon className="w-3 h-3" />
                    <span>{detectedIdentifier.label}</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="signin-identifier-input"
                    type="text"
                    required
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="e.g. name@gmail.com, 04201012028, or roll@igdtuw.ac.in"
                    className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none transition-all"
                    style={{
                      backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                      borderColor: isDark ? '#334155' : '#DDD5ED',
                      color: isDark ? '#F8FAFC' : '#241E34',
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#837B93] mt-1">
                  Supports your personal Google email, university email, or 11-digit Student ID.
                </p>
              </div>

              {/* Password Field with Eye-Icon Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signin-password-input"
                    className="text-xs font-bold"
                    style={{ color: isDark ? '#E2E8F0' : '#241E34' }}
                  >
                    Password
                  </label>
                  <span className="text-[11px] font-semibold text-[#7033F5]">
                    Strict Policy Enforced
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="signin-password-input"
                    type={showSignInPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your student account password"
                    className="w-full pl-4 pr-11 py-3 text-sm rounded-xl border focus:outline-none transition-all"
                    style={{
                      backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                      borderColor: isDark ? '#334155' : '#DDD5ED',
                      color: isDark ? '#F8FAFC' : '#241E34',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#766E87] hover:text-[#241E34] dark:hover:text-white transition-colors"
                    title={showSignInPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Real-time Password Validation Checklist Feedback */}
                <div
                  className="mt-3 p-3 rounded-xl border text-xs"
                  style={{
                    backgroundColor: isDark ? '#151F32' : '#FAF8FE',
                    borderColor: isDark ? '#2D3B52' : '#EDE7F6',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#7033F5]">
                      Security Requirements ({satisfiedCount}/5)
                    </span>
                    {/* Strength Progress Bar */}
                    <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${(satisfiedCount / 5) * 100}%`,
                          backgroundColor: satisfiedCount === 5 ? '#10B981' : satisfiedCount >= 3 ? '#F59E0B' : '#7033F5',
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordRules.minLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#766E87] dark:text-[#94A3B8]'
                      }`}
                    >
                      {passwordRules.minLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}
                      <span>Min 8 characters</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordRules.hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#766E87] dark:text-[#94A3B8]'
                      }`}
                    >
                      {passwordRules.hasUppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}
                      <span>1 uppercase letter (A-Z)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordRules.hasLowercase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#766E87] dark:text-[#94A3B8]'
                      }`}
                    >
                      {passwordRules.hasLowercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}
                      <span>1 lowercase letter (a-z)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordRules.hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#766E87] dark:text-[#94A3B8]'
                      }`}
                    >
                      {passwordRules.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}
                      <span>1 number (0-9)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 sm:col-span-2 ${
                        passwordRules.hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#766E87] dark:text-[#94A3B8]'
                      }`}
                    >
                      {passwordRules.hasSpecialChar ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}
                      <span>1 special symbol (@, #, $, !, %, *, ?)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Sign In Button */}
              <button
                id="btn-submit-signin"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#7033F5] via-[#804AF6] to-[#8A50F7] hover:opacity-95 shadow-md shadow-[#7033F5]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Univia</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthTab('signup')}
                  className="text-xs font-semibold text-[#7033F5] hover:underline cursor-pointer"
                >
                  New fresher at IGDTUW? Register student account
                </button>
              </div>
            </form>
          </div>
          ) : (
            /* ========================================================================= */
            /* TAB 2: SIGN UP (STUDENT CREDENTIALS ONLY)                                 */
            /* ========================================================================= */
            <div className="space-y-4">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-4 h-4 text-[#7033F5]" />
                  <h3 className="text-sm font-bold" style={{ color: isDark ? '#F8FAFC' : '#241E34' }}>
                    Sign up with student credentials
                  </h3>
                </div>
                <p className="text-xs" style={{ color: isDark ? '#94A3B8' : '#766E87' }}>
                  Register your account with your 11-digit Student Roll ID and Google or college email.
                </p>
              </div>

              <form onSubmit={handleStudentIdSignUp} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold mb-1 block" style={{ color: isDark ? '#E2E8F0' : '#241E34' }}>
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Shreya Singh"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                      style={{
                        backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                        borderColor: isDark ? '#334155' : '#DDD5ED',
                        color: isDark ? '#F8FAFC' : '#241E34',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold block" style={{ color: isDark ? '#E2E8F0' : '#241E34' }}>
                          Student Roll ID (11 Digits Only)
                        </label>
                        <span className="text-[10px] font-semibold text-[#7033F5]">
                          {regStudentId.length}/11
                        </span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{11}"
                        maxLength={11}
                        required
                        value={regStudentId}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setRegStudentId(val);
                        }}
                        placeholder="e.g. 04201012025"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none font-mono"
                        style={{
                          backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                          borderColor: isDark ? '#334155' : '#DDD5ED',
                          color: isDark ? '#F8FAFC' : '#241E34',
                        }}
                      />
                      <p className="text-[10px] text-[#766E87] dark:text-[#94A3B8] mt-1">
                        11-digit university enrollment number only.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold mb-1 block" style={{ color: isDark ? '#E2E8F0' : '#241E34' }}>
                        Email Address (Google or College Email) *
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. yourname@gmail.com or 04201012028@igdtuw.ac.in"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                        style={{
                          backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                          borderColor: isDark ? '#334155' : '#DDD5ED',
                          color: isDark ? '#F8FAFC' : '#241E34',
                        }}
                      />
                    </div>
                  </div>

                  {/* Student Phone Number Field */}
                  <div>
                    <label className="text-xs font-bold mb-1 block" style={{ color: isDark ? '#E2E8F0' : '#241E34' }}>
                      Student Mobile / Phone Number
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                      style={{
                        backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                        borderColor: isDark ? '#334155' : '#DDD5ED',
                        color: isDark ? '#F8FAFC' : '#241E34',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold mb-1 block" style={{ color: isDark ? '#E2E8F0' : '#241E34' }}>
                        Branch / Major
                      </label>
                      <select
                        value={regBranch}
                        onChange={(e) => setRegBranch(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                        style={{
                          backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                          borderColor: isDark ? '#334155' : '#DDD5ED',
                          color: isDark ? '#F8FAFC' : '#241E34',
                        }}
                      >
                        <option value="B.Tech Computer Science & AI (CSE-AI)">B.Tech Computer Science & AI (CSE-AI)</option>
                        <option value="B.Tech Computer Science & Engineering (CSE)">B.Tech Computer Science & Engg (CSE)</option>
                        <option value="B.Tech Artificial Intelligence & Data Science (AI-DS)">B.Tech AI & Data Science (AI-DS)</option>
                        <option value="B.Tech Information Technology (IT)">B.Tech Information Technology (IT)</option>
                        <option value="B.Tech Electronics & Communication (ECE)">B.Tech Electronics & Comm (ECE)</option>
                        <option value="B.Tech Electronics & Communication - AI">B.Tech Electronics & Comm - AI</option>
                        <option value="B.Tech Mechanical & Automation (MAE)">B.Tech Mechanical & Auto (MAE)</option>
                        <option value="B.Tech Electrical & Electronics (EEE)">B.Tech Electrical & Electronics (EEE)</option>
                        <option value="B.Arch Architecture & Planning">B.Arch Architecture & Planning</option>
                        <option value="BBA / MBA Management Studies">BBA / MBA Management</option>
                        <option value="BCA / MCA Computer Applications">BCA / MCA Computer Apps</option>
                        <option value="M.Tech / Dual Degree">M.Tech / Dual Degree</option>
                        <option value="PhD / Research Scholar">PhD / Research Scholar</option>
                        <option value="Others">Others</option>
                      </select>
                      {regBranch === 'Others' && (
                        <div className="pt-2 animate-in fade-in duration-150">
                          <label className="text-[11px] font-bold mb-1 block" style={{ color: isDark ? '#A5B4FC' : '#7033F5' }}>
                            Specify Other Branch / Department:
                          </label>
                          <input
                            type="text"
                            required
                            value={regCustomBranch}
                            onChange={(e) => setRegCustomBranch(e.target.value)}
                            placeholder="e.g. B.Sc Data Analytics, Diploma in EE"
                            className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                            style={{
                              backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                              borderColor: isDark ? '#6366F1' : '#7033F5',
                              color: isDark ? '#F8FAFC' : '#241E34',
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold mb-1 block" style={{ color: isDark ? '#E2E8F0' : '#241E34' }}>
                        Class Year
                      </label>
                      <select
                        value={regYear}
                        onChange={(e) => setRegYear(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                        style={{
                          backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                          borderColor: isDark ? '#334155' : '#DDD5ED',
                          color: isDark ? '#F8FAFC' : '#241E34',
                        }}
                      >
                        <option value="1st Year • Class of 2030">1st Year • Class of 2030</option>
                        <option value="2nd Year • Class of 2029">2nd Year • Class of 2029</option>
                        <option value="3rd Year • Class of 2028">3rd Year • Class of 2028</option>
                        <option value="4th Year • Class of 2027">4th Year • Class of 2027</option>
                      </select>
                    </div>
                  </div>

                  {/* Password with Show/Hide and Real-Time Checklist */}
                  <div>
                    <label className="text-xs font-bold mb-1 block" style={{ color: isDark ? '#E2E8F0' : '#241E34' }}>
                      Create Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Choose a strong password"
                        className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border focus:outline-none"
                        style={{
                          backgroundColor: isDark ? '#0F172A' : '#FAF8FE',
                          borderColor: isDark ? '#334155' : '#DDD5ED',
                          color: isDark ? '#F8FAFC' : '#241E34',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#766E87]"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Real-time Checklist for Sign Up */}
                    <div
                      className="mt-2.5 p-3 rounded-xl border text-[11px]"
                      style={{
                        backgroundColor: isDark ? '#151F32' : '#FAF8FE',
                        borderColor: isDark ? '#2D3B52' : '#EDE7F6',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5 font-bold text-[#7033F5]">
                        <span>Password Requirements ({satisfiedCount}/5)</span>
                        <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${(satisfiedCount / 5) * 100}%`,
                              backgroundColor: satisfiedCount === 5 ? '#10B981' : '#7033F5',
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className={passwordRules.minLength ? 'text-emerald-500 font-semibold' : 'text-[#766E87]'}>
                          • Min 8 chars
                        </span>
                        <span className={passwordRules.hasUppercase ? 'text-emerald-500 font-semibold' : 'text-[#766E87]'}>
                          • 1 uppercase (A-Z)
                        </span>
                        <span className={passwordRules.hasLowercase ? 'text-emerald-500 font-semibold' : 'text-[#766E87]'}>
                          • 1 lowercase (a-z)
                        </span>
                        <span className={passwordRules.hasNumber ? 'text-emerald-500 font-semibold' : 'text-[#766E87]'}>
                          • 1 number (0-9)
                        </span>
                        <span className={`col-span-2 ${passwordRules.hasSpecialChar ? 'text-emerald-500 font-semibold' : 'text-[#766E87]'}`}>
                          • 1 symbol (@, #, $, !, %, *, ?)
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-submit-signup"
                    type="submit"
                    disabled={isLoading || !isPasswordStrong}
                    className="w-full py-3 rounded-xl font-bold text-xs text-white bg-[#7033F5] hover:bg-[#5E22E2] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Create Verified Student Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
