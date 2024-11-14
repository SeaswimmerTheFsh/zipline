import type { File as DbFile } from '@/lib/db/models/file';
import { useSettingsStore } from '@/lib/store/settings';
import { Box, Center, Image as MantineImage, Paper, Stack, Text } from '@mantine/core';
import { Icon, IconFileUnknown, IconPlayerPlay, IconShieldLockFilled } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { renderMode } from '../pages/upload/renderMode';
import Render from '../render/Render';
import fileIcon from './fileIcon';

function PlaceholderContent({ text, Icon }: { text: string; Icon: Icon }) {
  return (
    <Stack align='center'>
      <Icon size={48} />
      <Text size='md' ta='center'>
        {text}
      </Text>
    </Stack>
  );
}

function Placeholder({ text, Icon, ...props }: { text: string; Icon: Icon; onClick?: () => void }) {
  return (
    <Center py='xs' style={{ height: '100%', width: '100%', cursor: 'pointed' }} {...props}>
      <PlaceholderContent text={text} Icon={Icon} />
    </Center>
  );
}

export default function DashboardFileType({
  file,
  show,
  password,
  code,
}: {
  file: DbFile | File;
  show?: boolean;
  password?: string;
  code?: boolean;
}) {
  const disableMediaPreview = useSettingsStore((state) => state.settings.disableMediaPreview);

  const dbFile = 'id' in file;
  const renderIn = renderMode(file.name.split('.').pop() || '');

  const [fileContent, setFileContent] = useState('');
  const [type, setType] = useState<string>(file.type.split('/')[0]);

  const gettext = async () => {
    const res = await fetch(`/raw/${file.name}${password ? `?pw=${password}` : ''}`);
    const text = await res.text();

    setFileContent(text);
  };

  useEffect(() => {
    if (code) {
      setType('text');
      gettext();
    } else if (type === 'text') {
      gettext();
    } else {
      return;
    }
  }, []);

  if (disableMediaPreview && !show)
    return <Placeholder text={`Click to view file ${file.name}`} Icon={fileIcon(file.type)} />;

  if (dbFile && file.password === true && !show)
    return <Placeholder text={`Click to view protected ${file.name}`} Icon={IconShieldLockFilled} />;

  if (dbFile && file.password === true && show)
    return (
      <Paper withBorder p='xs' style={{ cursor: 'pointer' }}>
        <Placeholder
          text={`Click to view protected ${file.name}`}
          Icon={IconShieldLockFilled}
          onClick={() => window.open(`/view/${file.name}${password ? `?pw=${password}` : ''}`)}
        />
      </Paper>
    );

  switch (type) {
    case 'video':
      return show ? (
        <video
          width='100%'
          autoPlay
          muted
          controls
          src={dbFile ? `/raw/${file.name}${password ? `?pw=${password}` : ''}` : URL.createObjectURL(file)}
        />
      ) : (file as DbFile).thumbnail && dbFile ? (
        <Box pos='relative'>
          <MantineImage src={`/raw/${(file as DbFile).thumbnail!.path}`} alt={file.name} />

          <Center
            pos='absolute'
            h='100%'
            top='50%'
            left='50%'
            style={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            <IconPlayerPlay size='4rem' stroke={3} />
          </Center>
        </Box>
      ) : (
        <Placeholder text={`Click to play video ${file.name}`} Icon={fileIcon(file.type)} />
      );
    case 'image':
      return show ? (
        <Center>
          <MantineImage
            mah={400}
            src={dbFile ? `/raw/${file.name}${password ? `?pw=${password}` : ''}` : URL.createObjectURL(file)}
            alt={file.name}
          />
        </Center>
      ) : (
        <MantineImage
          fit='contain'
          mah={400}
          src={dbFile ? `/raw/${file.name}${password ? `?pw=${password}` : ''}` : URL.createObjectURL(file)}
          alt={file.name}
        />
      );
    case 'audio':
      return show ? (
        <audio
          autoPlay
          muted
          controls
          style={{ width: '100%' }}
          src={dbFile ? `/raw/${file.name}${password ? `?pw=${password}` : ''}` : URL.createObjectURL(file)}
        />
      ) : (
        <Placeholder text={`Click to play audio ${file.name}`} Icon={fileIcon(file.type)} />
      );
    case 'text':
      return show ? (
        <Render mode={renderIn} language={file.name.split('.').pop() || ''} code={fileContent} />
      ) : (
        <Placeholder text={`Click to view text ${file.name}`} Icon={fileIcon(file.type)} />
      );
    default:
      if (dbFile && !show)
        return <Placeholder text={`Click to view file ${file.name}`} Icon={fileIcon(file.type)} />;

      if (dbFile && show)
        return (
          <Paper withBorder p='xs' style={{ cursor: 'pointer' }}>
            <Placeholder
              onClick={() => window.open(`/raw/${file.name}${password ? `?pw=${password}` : ''}`)}
              text={`Click to view file ${file.name} in a new tab`}
              Icon={fileIcon(file.type)}
            />
          </Paper>
        );
      else return <IconFileUnknown size={48} />;
  }
}
