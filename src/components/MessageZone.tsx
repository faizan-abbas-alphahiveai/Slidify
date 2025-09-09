import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useSubscription } from '../lib/subscription';

interface MessageZoneProps {
  location: 'images_section' | 'music_section' | 'settings_section';
  className?: string;
}

export const MessageZone: React.FC<MessageZoneProps> = ({ location, className = '' }) => {
  const { user } = useAuth();
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessage = async () => {
    // Determine subscription type based on the useSubscription hook
    let subscriptionType = 'unauthenticated';
    if (user) {
      if (isPremium) {
        subscriptionType = 'premium';
      } else {
        subscriptionType = 'authenticated';
      }
    }

    try {
      setIsLoading(true);
      
      // Fetch message from database - handle duplicate rows by ordering and limiting
      const { data, error } = await supabase
        .from('subscription_messages')
        .select('message')
        .eq('location', location)
        .eq('subscription_type', subscriptionType)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // Handle duplicate rows error specifically
        if (error.code === 'PGRST116') {
          // Try to get the first result without ordering
          const { data: firstData, error: firstError } = await supabase
            .from('subscription_messages')
            .select('message')
            .eq('location', location)
            .eq('subscription_type', subscriptionType)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          
          if (firstData && !firstError) {
            setMessage(firstData.message);
            return;
          }
        }
        
        // Try to fetch a fallback message for unauthenticated users
        if (subscriptionType !== 'unauthenticated') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('subscription_messages')
            .select('message')
            .eq('location', location)
            .eq('subscription_type', 'unauthenticated')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          
          if (fallbackData && !fallbackError) {
            setMessage(fallbackData.message);
            return;
          }
        }
        
        // If all else fails, set a default message for authenticated users
        if (subscriptionType === 'authenticated' && location === 'images_section') {
          const defaultMessage = "Want bigger slideshows? Upgrade to Premium for 100 photos!";
          setMessage(defaultMessage);
          return;
        }
      }

      if (data) {
        setMessage(data.message);
      }
    } catch (error) {
      // Set default message for authenticated users in images section
      if (subscriptionType === 'authenticated' && location === 'images_section') {
        setMessage("Want bigger slideshows? Upgrade to Premium for 100 photos!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wait for subscription data to load before fetching messages
    if (!subscriptionLoading) {
      fetchMessage();
    }
  }, [location, user, isPremium, subscriptionLoading]);

  // Don't render if still loading subscription or message
  if (subscriptionLoading || isLoading || !message) {
    return null;
  }
  
  // Clean the message to remove any unexpected content
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    return null;
  }

  // Parse and render message with enhanced styling to match the image
  const renderMessage = (text: string) => {
    // Icon definitions - easy to customize with larger sizes to prevent clipping
    const iconDefinitions: Record<string, { svg: string; size: string }> = {
      'Users': {
        svg: `<svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="6" cy="8" r="4"/><path d="M6 12c-2.67 0-6 1.34-6 4v2h12v-2c0-2.66-3.33-4-6-4z"/><circle cx="18" cy="8" r="4"/><path d="M18 12c-2.67 0-6 1.34-6 4v2h12v-2c0-2.66-3.33-4-6-4z"/></svg>`,
        size: 'w-6 h-6'
      },
      'ExternalLink': {
        svg: `<svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        size: 'w-4 h-4'
      }
    };

    // Handle icon syntax: [icon:IconName: text-color]
    let processedText = text.replace(/\[icon:([^:]+)(?::\s*([^\]]+))?\]/g, (match, iconName, textColor) => {
      const colorClass = textColor ? `text-${textColor}` : 'text-blue-500';
      const iconDef = iconDefinitions[iconName];
      
      if (iconDef) {
        return `<span class="inline-flex items-center gap-2 ${colorClass} min-w-0 flex-shrink-0">${iconDef.svg}</span>`;
      }
      
      // Fallback for unknown icons
      return `<span class="inline-flex items-center gap-2 ${colorClass} min-w-0 flex-shrink-0">📱 <span>${iconName}</span></span>`;
    });

    // Handle bold: **text**
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Handle italic: *text*
    processedText = processedText.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Handle underline: __text__
    processedText = processedText.replace(/__(.*?)__/g, '<u class="underline">$1</u>');

    // Handle links: [text](url) - make them blue to match website theme with custom external link icon
    processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-400 underline inline-flex items-center gap-2 min-w-0 flex-shrink-0">${linkText} ${iconDefinitions['ExternalLink'].svg}</a>`;
    });

    return processedText;
  };

  const finalRenderedMessage = renderMessage(cleanMessage);
  
  return (
    <div className={`w-full rounded-lg p-4 ${className}`}>
      <div 
        className="text-gray-700 dark:text-white text-sm flex flex-wrap items-start gap-3 min-w-0 break-words"
        dangerouslySetInnerHTML={{ __html: finalRenderedMessage }}
      />
    </div>
  );
};

