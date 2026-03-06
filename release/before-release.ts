import checkbox from '@inquirer/checkbox';
import { input } from '@inquirer/prompts';

const beforeRelease = async (): Promise<never> => {
  const choices = [
    {
      name: 'Check that all changes are committed',
      value: 'commit',
    },
    {
      name: 'Close all tasks related to the current release',
      value: 'tasks',
    },
    {
      name: 'Fill out the Changelog',
      value: 'changelog',
    },
    {
      name: 'Fill out the Migration Guide, Breaking Changes (if necessary)',
      value: 'migration_guide',
    },
  ];
  try {
    const res = await checkbox({
      choices,
      message: 'Before you make a release, check:',
    });
    const checked = JSON.stringify(res) == JSON.stringify(choices.map((a) => a.value));

    if (checked) {
      // eslint-disable-next-line no-console
      console.log('Do you want to perform the release?');
      // eslint-disable-next-line no-console
      console.log("Only 'yes' will be accepted to approve.");

      const answer = await input({ message: 'Enter a value: yes' });

      if (answer === 'yes') {
        return process.exit(0);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {}

  // eslint-disable-next-line no-console
  console.log('The project is not ready!');
  // eslint-disable-next-line no-console
  console.log('Release aborted');

  return process.exit(1);
};

void beforeRelease();
