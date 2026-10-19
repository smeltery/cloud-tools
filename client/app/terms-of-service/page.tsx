import { PolicyPage } from '@/components/policy-page';
export const metadata = { title: 'Terms' };
export default function Page() {
  return (
    <PolicyPage
      kind="Terms"
      title="Using Cloud Tools."
      intro="A few things to know about the software, your files, and the installation you choose to use."
      sections={[
        {
          title: 'Software license',
          body: 'Use, modification, and distribution of the software are governed by the PolyForm Shield 1.0.0 license included in the repository. Review the full license for its conditions and warranty disclaimer.',
        },
        {
          title: 'Your files',
          body: 'Only upload files you are entitled to process. Keep a copy of your original and check converted output before relying on it. Formats, codecs, input validity, and engine availability can affect results.',
        },
        {
          title: 'An operator-managed service',
          body: 'These project pages describe the software. Individual installations may have their own access rules, limits, retention policies, and operating terms. The project does not promise service availability or compatibility with every file.',
        },
        {
          title: 'Report a problem',
          body: 'Use the repository issue tracker for reproducible software defects. Include the tool, output format, and a non-sensitive reproduction where possible.',
        },
      ]}
    />
  );
}
