import { PolicyPage } from '@/components/policy-page';
export const metadata = { title: 'Privacy' };
export default function Page() {
  return (
    <PolicyPage
      kind="Privacy"
      title="Know where your files go."
      intro="A practical guide to what this software stores, where processing happens, and what to ask your installation’s operator."
      sections={[
        {
          title: 'Uploads and processing',
          body: 'This application uploads selected files to the storage configured by its operator. A worker reads those files and writes processed outputs. It is not a browser-only converter.',
        },
        {
          title: 'Job records and browser history',
          body: 'Job records include file names, types, sizes, operation, timestamps, and status. Recent conversion history is stored in browser local storage. Clearing browser history does not delete server-side files or job records.',
        },
        {
          title: 'Retention and access',
          body: 'Retention, storage access, logs, and deployment-level analytics depend on the installation. This project does not promise a fixed deletion window. The current API has no built-in per-user access controls; use a trusted installation and consult its operator before sending sensitive files.',
        },
        {
          title: 'Questions about your data',
          body: 'Contact the operator of the installation you are using for its retention and deletion practices. For software behavior or bugs, use the repository issue tracker without attaching private files or credentials.',
        },
      ]}
    />
  );
}
