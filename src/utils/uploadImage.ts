import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
};


export async function uploadImageAsync(localUri: string): Promise<string> {
  const cloudName = extra.cloudinaryCloudName;
  const preset = extra.cloudinaryUploadPreset;
  if (!cloudName || !preset) {
    throw new Error('Cloudinary is not configured (check .env / app.config.js).');
  }

  const form = new FormData();
  // React Native's FormData accepts this {uri,type,name} shape for files.
  form.append('file', { uri: localUri, type: 'image/jpeg', name: 'profile.jpg' } as any);
  form.append('upload_preset', preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}