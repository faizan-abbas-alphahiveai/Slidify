import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Slideshow {
  id: string;
  user_id: string;
  name: string;
  message: string;
  audio_url: string;
  slide_urls: string[];
  slide_duration: number;
  transition_type: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  loop_enabled?: boolean;
}

export interface Music {
  id: string;
  audio_url: string;
  song_title: string;
  access: 'public' | 'private' | 'premium';
  duration: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Music {
  id: string;
  audio_url: string;
  song_title: string;
  access: string;
  duration: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Tagline {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export interface ShareMessage {
  id: string;
  message: string;
  icon_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export interface SlideshowShare {
  id: string;
  slideshow_id: string;
  share_platform: 'facebook' | 'twitter' | 'whatsapp' | 'email' | 'copy';
  user_id: string | null;
  created_at: string;
}

export interface UserFeedback {
  id: string;
  star_rating: number;
  loved_feature: string;
  improvement: string;
  first_name: string;
  email: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TempSlideshowData {
  name: string;
  message: string;
  slides: string[];
  audio: string;
  duration: number;
  transition: string;
}

export const uploadFile = async (file: File, bucket: string, path: string) => {
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  
  if (error) throw error;
  return data;
};

export const uploadBlobAsFile = async (blobUrl: string, fileName?: string): Promise<string> => {
  try {
    // Fetch the blob data
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Generate a unique filename
    const fileExtension = blob.type.split('/')[1] || 'jpg';
    const uniqueFileName = fileName || `${uuidv4()}.${fileExtension}`;
    const filePath = `temp-slideshows/${uniqueFileName}`;
    
    // Create a File object from the blob
    const file = new File([blob], uniqueFileName, { type: blob.type });
    
    // Upload to Supabase Storage
    const uploadResult = await uploadFile(file, 'slideshow-images', filePath);
    
    // Get the public URL
    const publicUrl = getPublicUrl('slideshow-images', filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading blob as file:', error);
    throw error;
  }
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

export const saveSlideshow = async (slideshow: Omit<Slideshow, 'id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  

  // For authenticated users, set user_id; for anonymous users, set to null
  const slideshowData = {
    ...slideshow,
    user_id: user ? user.id : null
  };

  
  const { data, error } = await supabase
    .from('slideshows')
    .insert([slideshowData])
    .select()
    .single();

  
  if (error) throw error;
  return data;
};

export const getSlideshows = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data, error } = await supabase
    .from('slideshows')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  
  if (error) throw error;
  return data;
};

export const deleteSlideshow = async (id: string) => {
  const { error } = await supabase
    .from('slideshows')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const incrementSlideshowView = async (slideshowId: string) => {
  try {
    // Use RPC to atomically increment the view count
    const { error } = await supabase.rpc('increment_slideshow_view', {
      slideshow_id: slideshowId
    });

    if (error) {
      // Fallback to manual increment if RPC doesn't exist
      console.warn('RPC increment failed, using fallback method:', error);
      
      // Get current view count
      const { data: slideshow, error: fetchError } = await supabase
        .from('slideshows')
        .select('view_count')
        .eq('id', slideshowId)
        .single();

      if (fetchError) {
        console.error('Error fetching slideshow for view increment:', fetchError);
        return;
      }

      // Increment view count
      const { error: updateError } = await supabase
        .from('slideshows')
        .update({ view_count: (slideshow?.view_count || 0) + 1 })
        .eq('id', slideshowId);

      if (updateError) {
        console.error('Error incrementing view count:', updateError);
      }
    }
  } catch (error) {
    console.error('Error in incrementSlideshowView:', error);
  }
};

export const recordSlideshowShare = async (slideshowId: string, sharePlatform: 'facebook' | 'twitter' | 'whatsapp' | 'email' | 'copy') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('slideshow_shares')
      .insert([{
        slideshow_id: slideshowId,
        share_platform: sharePlatform,
        user_id: user ? user.id : null
      }]);

    if (error) {
      console.error('Error recording slideshow share:', error);
    } else {
  
    }
  } catch (error) {
    console.error('Error in recordSlideshowShare:', error);
  }
};

export const getSlideshowShares = async (slideshowId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('slideshow_shares')
    .select('*')
    .eq('slideshow_id', slideshowId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching slideshow shares:', error);
    return [];
  }

  return data || [];
};

export const getSlideshowShareStats = async (slideshowId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('slideshow_shares')
    .select('share_platform')
    .eq('slideshow_id', slideshowId);

  if (error) {
    console.error('Error fetching slideshow share stats:', error);
    return null;
  }

  // Count shares by platform
  const stats = {
    total: data?.length || 0,
    facebook: 0,
    twitter: 0,
    whatsapp: 0,
    email: 0,
    copy: 0
  };

  data?.forEach(share => {
    stats[share.share_platform]++;
  });

  return stats;
};

export const getRandomTagline = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('taglines')
      .select('text')
      .eq('is_active', true);

    if (error) {
      // Return default tagline if database query fails
      return 'Create beautiful slideshows with a few simple clicks';
    }

    if (data && data.length > 0) {
      // Select a random tagline from the array
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex].text;
    }

    // Return default tagline if no active taglines found
    return 'Create beautiful slideshows with a few simple clicks';
  } catch (error) {
    console.error('Error in getRandomTagline:', error);
    return 'Create beautiful slideshows with a few simple clicks';
  }
};

export const getUserTaglines = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('taglines')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTagline = async (text: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');

  const { data, error } = await supabase
    .from('taglines')
    .insert([{
      text: text.trim(),
      user_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTagline = async (id: string, text: string, isActive: boolean) => {
  const { error } = await supabase
    .from('taglines')
    .update({
      text: text.trim(),
      is_active: isActive
    })
    .eq('id', id);

  if (error) throw error;
};

export const deleteTagline = async (id: string) => {
  const { error } = await supabase
    .from('taglines')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getRandomShareMessage = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('share_messages')
      .select('message, icon_name')
      .eq('is_active', true);

    if (error) {
      // Return default message if database query fails
      return JSON.stringify({ message: 'Your slideshow is ready to share with the world!', icon_name: 'SquareUserRound' });
    }

    if (data && data.length > 0) {
      // Select a random message from the array
      const randomIndex = Math.floor(Math.random() * data.length);
      return JSON.stringify(data[randomIndex]);
    }

    // Return default message if no active messages found
    return JSON.stringify({ message: 'Your slideshow is ready to share with the world!', icon_name: 'SquareUserRound' });
  } catch (error) {
    console.error('Error in getRandomShareMessage:', error);
    return JSON.stringify({ message: 'Your slideshow is ready to share with the world!', icon_name: 'SquareUserRound' });
  }
};

export const getUserShareMessages = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('share_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createShareMessage = async (message: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');

  const { data, error } = await supabase
    .from('share_messages')
    .insert([{
      message: message.trim(),
      user_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateShareMessage = async (id: string, message: string, isActive: boolean) => {
  const { error } = await supabase
    .from('share_messages')
    .update({
      message: message.trim(),
      is_active: isActive
    })
    .eq('id', id);

  if (error) throw error;
};

export const deleteShareMessage = async (id: string) => {
  const { error } = await supabase
    .from('share_messages')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const submitUserFeedback = async (feedback: {
  starRating: number;
  lovedFeature: string;
  improvement: string;
  firstName: string;
  email: string;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('user_feedback')
      .insert([{
        star_rating: feedback.starRating,
        loved_feature: feedback.lovedFeature.trim(),
        improvement: feedback.improvement.trim(),
        first_name: feedback.firstName.trim(),
        email: feedback.email.trim(),
        user_id: user ? user.id : null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting user feedback:', error);
    throw error;
  }
};

export const getUserFeedback = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user feedback:', error);
    return [];
  }

  return data || [];
};

export const getUserSubscriptionMessages = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('subscription_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createSubscriptionMessage = async (message: string, subscriptionType: string, location: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');

  const { data, error } = await supabase
    .from('subscription_messages')
    .insert([{
      message: message.trim(),
      subscription_type: subscriptionType,
      location: location,
      user_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSubscriptionMessage = async (id: string, message: string, subscriptionType: string, location: string, isActive: boolean) => {
  const { error } = await supabase
    .from('subscription_messages')
    .update({
      message: message.trim(),
      subscription_type: subscriptionType,
      location: location,
      is_active: isActive
    })
    .eq('id', id);

  if (error) throw error;
};

export const deleteSubscriptionMessage = async (id: string) => {
  const { error } = await supabase
    .from('subscription_messages')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getRandomFeedbackHeading = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('feedback_headings')
      .select('heading')
      .eq('is_active', true);

    if (error) {
      // Return default heading if database query fails
      return 'Give us Feedback';
    }

    if (data && data.length > 0) {
      // Select a random heading from the array
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex].heading;
    }

    // Return default heading if no active headings found
    return 'Give us Feedback';
  } catch (error) {
    console.error('Error in getRandomFeedbackHeading:', error);
    return 'Give us Feedback';
  }
};

export const getRandomSlideshowNameMessage = async (): Promise<{ slideshow_name: string; slideshow_message: string }> => {
  try {
    const { data, error } = await supabase
      .from('slideshow_name_msg')
      .select('slideshow_name, slideshow_message')
      .eq('is_active', true);

    if (error) {
      // Return default values if database query fails
      return {
        slideshow_name: 'My first slideshow on slidify.app',
        slideshow_message: 'Trying out this new tool for creating and sharing virtual slideshows - slidify.app'
      };
    }

    if (data && data.length > 0) {
      // Select a random entry from the array
      const randomIndex = Math.floor(Math.random() * data.length);
      return {
        slideshow_name: data[randomIndex].slideshow_name,
        slideshow_message: data[randomIndex].slideshow_message
      };
    }

    // Return default values if no active entries found
    return {
      slideshow_name: 'My first slideshow on slidify.app',
      slideshow_message: 'Trying out this new tool for creating and sharing virtual slideshows - slidify.app'
    };
  } catch (error) {
    console.error('Error in getRandomSlideshowNameMessage:', error);
    return {
      slideshow_name: 'My first slideshow on slidify.app',
      slideshow_message: 'Trying out this new tool for creating and sharing virtual slideshows - slidify.app'
    };
  }
};
export const getUserFeedbackHeadings = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('feedback_headings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createFeedbackHeading = async (heading: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');

  const { data, error } = await supabase
    .from('feedback_headings')
    .insert([{
      heading: heading.trim(),
      user_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateFeedbackHeading = async (id: string, heading: string, isActive: boolean) => {
  const { error } = await supabase
    .from('feedback_headings')
    .update({
      heading: heading.trim(),
      is_active: isActive
    })
    .eq('id', id);

  if (error) throw error;
};

export const deleteFeedbackHeading = async (id: string) => {
  const { error } = await supabase
    .from('feedback_headings')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const joinWaitlist = async (email: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('waitlist')
      .insert([{
        email: email.trim().toLowerCase(),
        user_id: user ? user.id : null
      }])
      .select()
      .single();

    if (error) {
      // Handle duplicate email error with a more user-friendly message
      if (error.code === '23505') {
        throw new Error('This email is already on our waitlist!');
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error joining waitlist:', error);
    throw error;
  }
};
export const getSubscriptionMessage = async (subscriptionType: string, location: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('subscription_messages')
      .select('message')
      .eq('subscription_type', subscriptionType)
      .eq('location', location)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription message:', error);
      return null;
    }

    return data?.message || null;
  } catch (error) {
    console.error('Error in getSubscriptionMessage:', error);
    return null;
  }
};