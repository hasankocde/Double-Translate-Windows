// App.tsx

import '@arco-design/web-react/dist/css/arco.css';
import '../styles/app.css';
import { useState, useEffect, useCallback } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Grid,
  Input,
  Typography,
  Notification,
  Select,
} from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';

const { Row, Col } = Grid;
const { Option } = Select;
const { TextArea } = Input;

const targetLanguageList = [
  { label: 'English', value: 'en' },
  { label: 'Turkish', value: 'tr' },
  { label: 'German', value: 'de' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Afrikaans', value: 'af' },
  { label: 'Albanian', value: 'sq' },
  { label: 'Armenian', value: 'hy' },
  { label: 'Azerbaijani', value: 'az' },
  { label: 'Basque', value: 'eu' },
  { label: 'Belarusian', value: 'be' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Catalan', value: 'ca' },
  { label: 'Chinese (Simplified)', value: 'zh-CN' },
  { label: 'Chinese (Traditional)', value: 'zh-TW' },
  { label: 'Croatian', value: 'hr' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Estonian', value: 'et' },
  { label: 'Filipino', value: 'tl' },
  { label: 'Finnish', value: 'fi' },
  { label: 'Galician', value: 'gl' },
  { label: 'Georgian', value: 'ka' },
  { label: 'Greek', value: 'el' },
  { label: 'Gujarati', value: 'gu' },
  { label: 'Haitian Creole', value: 'ht' },
  { label: 'Hebrew', value: 'iw' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Icelandic', value: 'is' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Irish', value: 'ga' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Kannada', value: 'kn' },
  { label: 'Korean', value: 'ko' },
  { label: 'Latin', value: 'la' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Lithuanian', value: 'lt' },
  { label: 'Macedonian', value: 'mk' },
  { label: 'Malay', value: 'ms' },
  { label: 'Maltese', value: 'mt' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Persian', value: 'fa' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Serbian', value: 'sr' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Swahili', value: 'sw' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Telugu', value: 'te' },
  { label: 'Thai', value: 'th' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Urdu', value: 'ur' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Welsh', value: 'cy' },
  { label: 'Yiddish', value: 'yi' },
];

function App() {
  const [targetLanguage1, setTargetLanguage1] = useState<string>('en');
  const [targetLanguage2, setTargetLanguage2] = useState<string>('tr');
  const [sourceText, setSourceText] = useState('');
  const [translatedContent1, setTranslatedContent1] = useState<string>('');
  const [translatedContent2, setTranslatedContent2] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // Normalize spaces in the text
  const normalizeSpaces = (text: string): string => {
    const normalized = text.replace(/\s+/g, ' ').trim();
    return normalized;
  };

  // Debounce the input changes (reduced delay)
  const debouncedSetSourceText = debounce((value: string) => {
    const normalizedValue = normalizeSpaces(value);
    setSourceText(normalizedValue);
  }, 150); // Reduced from 300ms to 150ms

  const handleChange = (value: string) => {
    debouncedSetSourceText(value);
  };

  useEffect(() => {
    // Clipboard listener
    const unsubscribeClipboard = window.electron.ipcRenderer.on(
      'clipboard-text',
      (text: string) => {
        const normalizedText = normalizeSpaces(text);
        setSourceText(normalizedText);
      }
    );

    return () => {
      unsubscribeClipboard();
    };
  }, []);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      const { clientX: x, clientY: y } = event;
      window.electron.ipcRenderer.sendMessage('show-context-menu', x, y);
    };

    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Debounced translation function
  const debouncedTranslate = useCallback(
    debounce(async () => {
      if (sourceText.length > 0) {
        setLoading(true);
        try {
          const result = await window.electron.ipcRenderer.invoke(
            'translate',
            sourceText,
            [targetLanguage1, targetLanguage2]
          );

          const [status, ...messages] = result;

          setLoading(false);

          if (status === 'success') {
            setTranslatedContent1(messages[0]);
            setTranslatedContent2(messages[1]);
          } else if (status === 'error') {
            Notification.warning({
              id: 'main_warn',
              title: t('notification.warning'),
              content: t('notification.translation_failed'),
            });
          }
        } catch (error) {
          setLoading(false);
          Notification.error({
            id: 'main_error',
            title: 'Error',
            content: 'An error occurred during translation.',
          });
          console.error(error);
        }
      } else {
        setTranslatedContent1('');
        setTranslatedContent2('');
      }
    }, 300), // Adjusted debounce delay
    [sourceText, targetLanguage1, targetLanguage2, t]
  );

  useEffect(() => {
    debouncedTranslate();

    return () => {
      debouncedTranslate.cancel();
    };
  }, [debouncedTranslate]);

  const getLanguageLabel = (code: string): string => {
    const option = targetLanguageList.find((item) => item.value === code);
    return option ? option.label : code;
  };

  return (
    <div style={{ padding: 0, margin: 0 }}>
      <Typography.Paragraph>
        <Row className="main-container" style={{ margin: 0 }} gutter={[5, 10]}>
          <Col span={24} className="full-width">
            {/* Input Area */}
            <div className="input-container">
              <TextArea
                className="text-area1"
                value={sourceText}
                onChange={handleChange}
                style={{
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                }}
              />
            </div>

            {/* Target Language 1 */}
            <div className="result-container">
              <Select
                style={{ width: 58, height: 25 }}
                value={targetLanguage1}
                onChange={(value: string) => {
                  setTargetLanguage1(value);
                }}
                placeholder={getLanguageLabel(targetLanguage1)}
              >
                {targetLanguageList.map((option) => (
                  <Option
                    key={option.value}
                    value={option.value}
                    style={{ fontSize: 12 }}
                  >
                    {option.value}
                  </Option>
                ))}
              </Select>
              <TextArea
                className="text-area2"
                spellCheck={false}
                value={translatedContent1}
                style={{
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                }}
              />
            </div>

            {/* Target Language 2 */}
            <div className="result-container">
              <Select
                style={{ width: 58, height: 25 }}
                value={targetLanguage2}
                onChange={(value: string) => {
                  setTargetLanguage2(value);
                }}
                placeholder={getLanguageLabel(targetLanguage2)}
              >
                {targetLanguageList.map((option) => (
                  <Option
                    key={option.value}
                    value={option.value}
                    style={{ fontSize: 12 }}
                  >
                    {option.value}
                  </Option>
                ))}
              </Select>
              <TextArea
                className="text-area3"
                spellCheck={false}
                value={translatedContent2}
                style={{
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                }}
              />
            </div>
          </Col>
        </Row>
      </Typography.Paragraph>
    </div>
  );
}

export default function RootApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </Router>
  );
}
