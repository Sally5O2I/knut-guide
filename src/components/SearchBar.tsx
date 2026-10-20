import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

interface Props {
  value?: string;
  onChange?: (v: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

/** value/onChange를 주면 그 자리에서 거르고, 안 주면 검색 화면으로 넘어간다 */
export function SearchBar({ value, onChange, autoFocus, placeholder = '가게, 장소, 꿀팁 검색 (예: 부리또, 프린트, 999)' }: Props) {
  const navigate = useNavigate();
  const [local, setLocal] = useState('');
  const v = value ?? local;
  const set = onChange ?? setLocal;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!onChange && v.trim()) navigate(`/search?q=${encodeURIComponent(v.trim())}`);
  };

  return (
    <form className="searchbar" role="search" onSubmit={submit}>
      <Icon name="search" />
      <label className="visually-hidden" htmlFor="q">
        검색
      </label>
      <input id="q" type="search" value={v} onChange={(e) => set(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} enterKeyHint="search" autoComplete="off" />
      {v && (
        <button type="button" className="clear" onClick={() => set('')} aria-label="검색어 지우기">
          <Icon name="close" />
        </button>
      )}
    </form>
  );
}
