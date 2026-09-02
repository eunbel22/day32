export const sendSlackMessage = async (message: string, details: Record<string, string>) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase configuration not found');
      return;
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-slack-message`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        message,
        details,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Slack message:', response.statusText);
    }
  } catch (error) {
    console.error('Failed to send Slack message:', error);
  }
};
