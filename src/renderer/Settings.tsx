import '@arco-design/web-react/dist/css/arco.css';
import { useState } from 'react';
import {
  Grid,
  Input,
  Select,
  Drawer,
  Form,
  Switch,
  Radio,
} from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

const { Row } = Grid;
const FormItem = Form.Item;
const RadioGroup = Radio.Group; // Added this line

/* eslint-disable import/prefer-default-export */
export function Settings(props: {
  showSettings: boolean;
  onCancel: () => void;
}) {
  const { showSettings, onCancel } = props;
  const [autoStart, setAutoStart] = useState<boolean>();
  const [shortcut, setShortcut] = useState<string>();
  const [shortcutPrefix, setShortcutPrefix] = useState<string>();
  const [runInBackground, setRunInBackground] = useState<boolean>();
  const { t } = useTranslation();

  let shortcutPrefixOptions = [
    {
      value: 'alt',
      label: 'Alt',
    },
    {
      value: 'ctrl',
      label: 'Ctrl',
    },
    {
      value: 'shift',
      label: 'Shift',
    },
    {
      value: 'win',
      label: 'Win',
    },
  ];
  if (window.electron.platform === 'darwin') {
    shortcutPrefixOptions = [
      {
        value: 'option',
        label: 'Opt',
      },
      {
        value: 'ctrl',
        label: 'Ctrl',
      },
      {
        value: 'shift',
        label: 'Shift',
      },
      {
        value: 'command',
        label: 'Cmd',
      },
    ];
  }
  const shortcutOptions = [
    { value: '1', key: '1' },
    { value: '2', key: '2' },
    // ... (rest of the options)
    { value: '/', key: '/' },
  ];

  return (
    <div>
      <Drawer
        width={500}
        title={<span>{t('settings.title')}</span>}
        footer
        visible={showSettings}
        onCancel={onCancel}
        afterOpen={() => {
          window.electron.ipcRenderer.once('settings', (arg: any) => {
            setAutoStart(arg[0]);
            setRunInBackground(arg[1]);
            setShortcutPrefix(arg[2]);
            setShortcut(arg[3]);
          });
          window.electron.ipcRenderer.sendMessage('settings', [
            'get',
            ['auto_start', 'run_in_background', 'shortcut_prefix', 'shortcut'],
          ]);
        }}
        afterClose={() => {
          window.electron.ipcRenderer.sendMessage('settings', [
            'set',
            ['auto_start', autoStart],
          ]);
          window.electron.ipcRenderer.sendMessage('settings', [
            'set',
            ['run_in_background', runInBackground],
          ]);
          window.electron.ipcRenderer.sendMessage('settings', [
            'set',
            ['shortcut_prefix', shortcutPrefix],
          ]);
          window.electron.ipcRenderer.sendMessage('settings', [
            'set',
            ['shortcut', shortcut],
          ]);
        }}
      >
        <Row>
          <Form layout="vertical" style={{ width: 450 }} autoComplete="off">
            <FormItem label={t('settings.auto_start')} field="autostart">
              <Switch
                checked={autoStart}
                onChange={(value: boolean) => {
                  setAutoStart(value);
                }}
              />
            </FormItem>
            <FormItem
              label={t('settings.run_in_background')}
              field="runInBackground"
            >
              <Switch
                checked={runInBackground}
                onChange={(value: boolean) => {
                  setRunInBackground(value);
                }}
              />
            </FormItem>
            <FormItem label={t('settings.shortcut')}>
              <Grid.Row>
                <Grid.Col span={12}>
                  <RadioGroup
                    options={shortcutPrefixOptions}
                    size="default"
                    type="button"
                    value={shortcutPrefix}
                    style={{ marginBottom: 20 }}
                    onChange={(value: string) => {
                      setShortcutPrefix(value);
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={1}>+</Grid.Col>
                <Grid.Col span={4}>
                  <Select
                    value={shortcut}
                    onChange={(value: string) => {
                      setShortcut(value);
                    }}
                    showSearch
                  >
                    {shortcutOptions.map((item) => (
                      <Select.Option value={item.value} key={item.value}>
                        {item.key}
                      </Select.Option>
                    ))}
                  </Select>
                </Grid.Col>
              </Grid.Row>
            </FormItem>
          </Form>
        </Row>
      </Drawer>
    </div>
  );
}
