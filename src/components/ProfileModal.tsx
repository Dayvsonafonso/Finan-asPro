import { useState, useRef } from 'react';
import { User, Lock, Mail, Camera, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  );
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const isGoogleUser = user?.app_metadata?.provider === 'google';
  const avatarUrl = user?.user_metadata?.avatar_url || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'default')}`;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: urlWithCacheBuster }
      });

      if (updateError) throw updateError;

      toast.success('Foto de perfil atualizada!');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast.error('Erro ao atualizar foto: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = async (seed: string) => {
    if (!user) return;
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    
    if (avatarUrl === url) return;

    setIsUploadingAvatar(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: url }
      });
      if (error) throw error;
      toast.success('Avatar atualizado!');
    } catch (err: any) {
      console.error('Preset avatar error:', err);
      toast.error('Erro ao atualizar avatar: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      toast.error('O nome não pode estar vazio.');
      return;
    }
    setIsSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim(), name: displayName.trim() }
      });
      if (error) throw error;
      toast.success('Nome atualizado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao atualizar nome: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err: any) {
      toast.error('Erro ao alterar senha: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Meu Perfil">
      <div className="space-y-6">
        {/* Avatar & Info Header */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="relative mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="relative group cursor-pointer"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-500/10 transition-all group-hover:border-indigo-300 dark:group-hover:border-indigo-600">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover transition-all group-hover:scale-110 group-hover:brightness-75"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Overlay on hover */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {/* Upload spinner */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50">
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                </div>
              )}
            </button>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg pointer-events-none">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuário'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          
          <div className="mt-6 w-full max-w-sm">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Ou escolha um avatar pronto</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {['Felix', 'Aneka', 'Oliver', 'Mia', 'Jack', 'Zoe'].map(seed => {
                const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                const isSelected = avatarUrl === url;
                return (
                  <button
                    key={seed}
                    onClick={() => handleSelectPreset(seed)}
                    disabled={isUploadingAvatar}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                      isSelected 
                        ? 'border-indigo-600 scale-110 shadow-md ring-2 ring-indigo-500/30' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:scale-105 cursor-pointer opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={seed} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          {isGoogleUser && (
            <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Conta Google
            </span>
          )}
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
            <User className="w-4 h-4" />
            Nome
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Seu nome"
            />
            <Button
              onClick={handleSaveName}
              disabled={isSavingName || displayName === (user?.user_metadata?.full_name || user?.user_metadata?.name || '')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isSavingName ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Email Field (read-only) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
            <Mail className="w-4 h-4" />
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
          />
        </div>

        {/* Password Section */}
        {!isGoogleUser && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Alterar Senha</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Defina uma nova senha para sua conta</p>
                </div>
              </div>
              <motion.div animate={{ rotate: showPasswordSection ? 90 : 0 }}>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </button>

            <AnimatePresence>
              {showPasswordSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 px-1 pb-2">
                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Nova Senha
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          placeholder="Mínimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          placeholder="Repita a nova senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Password mismatch warning */}
                    {confirmPassword && newPassword !== confirmPassword && (
                      <div className="flex items-center gap-2 text-xs text-red-500 px-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>As senhas não coincidem</span>
                      </div>
                    )}

                    <Button
                      onClick={handleChangePassword}
                      disabled={isSavingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2"
                    >
                      {isSavingPassword ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Alterando...</span>
                        </div>
                      ) : (
                        'Alterar Senha'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Google users info */}
        {isGoogleUser && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Conta Google</p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/60 mt-0.5">
                Sua senha e avatar são gerenciados pelo Google. Você pode alterar apenas seu nome de exibição.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
