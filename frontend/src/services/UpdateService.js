import packageInfo from '../../package.json';
const CURRENT_VERSION = packageInfo.version;
const GITHUB_REPO = 'amvaltrx/focusflow';


class UpdateService {
    async checkForUpdates() {
        try {
            // Fetch the latest package.json from main branch
            const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/frontend/package.json?t=${Date.now()}`);
            if (!res.ok) return { available: false };
            
            const data = await res.json();
            if (data.version && data.version !== CURRENT_VERSION) {
                return {
                    available: true,
                    newVersion: data.version,
                    downloadUrl: `https://github.com/${GITHUB_REPO}/actions`
                };
            }
        } catch (e) {
            console.error('Failed to check for updates', e);
        }
        return { available: false };
    }
}

export default new UpdateService();
