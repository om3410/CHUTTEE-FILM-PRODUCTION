import { FiBookOpen, FiHelpCircle } from 'react-icons/fi';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const apiDocsUrl = new URL(client.defaults.baseURL, window.location.origin);
apiDocsUrl.pathname = '/swagger/';

const topics = [
  {
    title: 'How do I update a scene?',
    detail: 'Open Scenes, select Edit on a scene card or row, change its details or status, then choose Save changes.',
  },
  {
    title: 'Why can’t I add crew or equipment?',
    detail: 'Creating or deleting crew members and equipment requires a CREW or ADMIN account. Contact an administrator to request access.',
  },
  {
    title: 'Where can I see API details?',
    detail: 'The API documentation lists the available backend endpoints and their request formats.',
  },
];

export default function Help() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Help &amp; Support</h1>
        <p className="text-sm text-zinc-400">Guides and answers for using CHUTTEE.</p>
      </div>

      <Card>
        <CardHeader title="Frequently asked questions" subtitle="Quick help with common tasks" icon={FiHelpCircle} />
        <CardBody className="space-y-4">
          {topics.map((topic) => (
            <div key={topic.title} className="border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-zinc-200">{topic.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{topic.detail}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="More help" subtitle={`Signed in as ${user?.email || 'user'}`} icon={FiBookOpen} />
        <CardBody>
          <a href={apiDocsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800">
            <FiBookOpen className="h-4 w-4" />
            Open API documentation
          </a>
        </CardBody>
      </Card>
    </div>
  );
}
