import packageInfo from '../../package.json';
const CURRENT_VERSION = packageInfo.version;
const GITHUB_REPO = 'amvaltrx/focusflow';


class UpdateService {
    async checkForUpdates() {
        try {
            // Fetch the latest package.json from GitHub REST API to bypass CDN caching instantly
            const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/frontend/package.json`);
            if (!res.ok) {
                // Fallback to raw githubusercontent if API rate limit or error occurs
                const fallbackRes = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/frontend/package.json?t=${Date.now()}`);
                if (fallbackRes.ok) {
                    const data = await fallbackRes.json();
                    if (data.version && data.version !== CURRENT_VERSION) {
                        return {
                            available: true,
                            newVersion: data.version,
                            downloadUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/main/frontend/public/focusflow.apk`
                        };
                    }
                }
                return { available: false };
            }
            
            const data = await res.json();
            if (data.content) {
                // Decode base64 content from GitHub API
                const decoded = atob(data.content.replace(/\s/g, ''));
                const parsed = JSON.parse(decoded);
                if (parsed.version && parsed.version !== CURRENT_VERSION) {
                    return {
                        available: true,
                        newVersion: parsed.version,
                        downloadUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/main/frontend/public/focusflow.apk`
                    };
                }
            }
        } catch (e) {
            console.error('Failed to check for updates', e);
        }
        return { available: false };
    }
}

export default new UpdateService();
