import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Music, Clock, Search, Filter, Upload, Crown } from 'lucide-react';
import { supabase, type Music as SupabaseMusic } from '../lib/supabase';
import { useSubscription } from '../lib/subscription';

interface MusicSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMusic: (music: SupabaseMusic) => void;
}

export default function MusicSelector({ isOpen, onClose, onSelectMusic }: MusicSelectorProps) {
  const { isPremium } = useSubscription();
  const [musicList, setMusicList] = useState<SupabaseMusic[]>([]);
  const [filteredMusicList, setFilteredMusicList] = useState<SupabaseMusic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPublicMusic();
    }
  }, [isOpen]);

  // Filter music list when search term changes
  useEffect(() => {
    let filtered = musicList;

    // Filter by search term (song title or genre)
    if (searchTerm.trim()) {
      filtered = filtered.filter(music =>
        music.song_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (music.genre && music.genre.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredMusicList(filtered);
  }, [musicList, searchTerm]);
  // Update audio time and duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, []);
  const loadPublicMusic = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query based on premium status
      let query = supabase
        .from('music')
        .select('id, song_title, audio_url, duration, genre')
        .in('access', isPremium ? ['public', 'premium'] : ['public'])
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      const musicData = data || [];
      setMusicList(musicData);
      setFilteredMusicList(musicData);
    } catch (error) {
      console.error('Error loading music:', error);
      setError('Failed to load music library');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setUploadError('Please select an audio file (MP3, WAV, etc.)');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setUploadError('Audio file must be smaller than 50MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create filename with PREMIUM prefix
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'mp3';
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const fileName = `${userId}/PREMIUM-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(fileName);

      // Get audio duration
      const audioDuration = await getAudioDuration(file);

      // Save to music table
      const { data: musicData, error: dbError } = await supabase
        .from('music')
        .insert([{
          song_title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          audio_url: publicUrl,
          duration: Math.round(audioDuration),
          access: 'private',
          user_id: userId
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // Add to music list and select it
      const newMusic = musicData as SupabaseMusic;
      setMusicList(prev => [newMusic, ...prev]);
      setFilteredMusicList(prev => [newMusic, ...prev]);
      
      // Auto-select the uploaded music
      handleSelectMusic(newMusic);
    } catch (error) {
      console.error('Error uploading audio:', error);
      setUploadError('Failed to upload audio file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        resolve(180); // Default to 3 minutes if duration can't be determined
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  const togglePreview = (music: SupabaseMusic) => {
    if (playingId === music.id) {
      // Stop current preview
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
      setCurrentTime(0);
      setDuration(0);
    } else {
      // Start new preview
      if (audioRef.current) {
        audioRef.current.src = music.audio_url;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          console.error('Audio preview failed:', error);
        });
      }
      setPlayingId(music.id);
    }
  };

  const handleAudioEnded = () => {
    setPlayingId(null);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };
  const handleSelectMusic = (music: SupabaseMusic) => {
    // Stop any playing preview
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingId(null);
    setCurrentTime(0);
    setDuration(0);
    onSelectMusic(music);
    onClose();
  };

  const formatDuration = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  const clearFilters = () => {
    setSearchTerm('');
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden transition-colors flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Music className="text-blue-600" size={24} />
              Select Music
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">Upgrade to premium to access our full music library and upload your own audio track.</p>
          
          {/* Search Controls */}
          <div className="mt-4">
            {/* Premium Upload Section */}
            {isPremium && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="text-blue-600 dark:text-blue-400" size={20} />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Upload Your Own Audio</h3>
                </div>
                
                {uploadError && (
                  <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                    {uploadError}
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label
                    htmlFor="audio-upload"
                    className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload Audio
                      </>
                    )}
                  </label>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    MP3, WAV, etc. (Max 50MB)
                  </span>
                </div>
              </div>
            )}
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search by song title or genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            {/* Results count */}
            {searchTerm && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Showing {filteredMusicList.length} of {musicList.length} songs
              </p>
            )}
          </div>
        </div>

        {/* Audio Player Controls - Only show when playing */}
        {playingId && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const currentMusic = filteredMusicList.find(m => m.id === playingId);
                  if (playingId && audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    setPlayingId(null);
                  }
                  if (currentMusic) togglePreview(currentMusic);
                }}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                <Pause size={16} />
              </button>
              
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  style={{ '--progress': `${duration > 0 ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties}
                />
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300 min-w-0">
                <p className="font-medium truncate">
                  {filteredMusicList.find(m => m.id === playingId)?.song_title}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading music library...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Music size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={loadPublicMusic}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : musicList.length === 0 ? (
            <div className="text-center py-12">
              <Music size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-300">No public music available</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Check back later for new additions</p>
            </div>
          ) : filteredMusicList.length === 0 ? (
            <div className="text-center py-12">
              <Music size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-300">No songs match your search</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
              <button
                onClick={clearFilters}
                className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all text-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMusicList.map((music) => (
                <div
                  key={music.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    playingId === music.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 dark:text-white">
                      <h3 className="font-semibold mb-1">{music.song_title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Clock size={14} />
                        <span>{formatDuration(music.duration)}</span>
                        {music.genre && (
                          <>
                            <span>•</span>
                            <span className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full text-xs">
                              {music.genre}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => togglePreview(music)}
                      className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title={playingId === music.id ? 'Stop preview' : 'Preview'}
                    >
                      {playingId === music.id ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleSelectMusic(music)}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all text-sm"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hidden audio element for previews */}
        <audio
          ref={audioRef}
          onEnded={handleAudioEnded}
          volume={0.5}
          className="hidden"
        />
      </div>
    </div>
  );
}