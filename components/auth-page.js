"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

const EMPTY_FORM = { nickname: "", password: "" };

async function readState() {
  const response = await fetch("/api/game/state", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "无法加载账号信息");
  }

  return payload;
}

export default function AuthPage({ sessionPlayerId }) {
  const [accounts, setAccounts] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [loginForm, setLoginForm] = useState(EMPTY_FORM);
  const [registerForm, setRegisterForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const payload = await readState();
        setAccounts(payload.accounts);
        setCurrentPlayer(payload.currentPlayer);

        if (sessionPlayerId && payload.currentPlayer) {
          setMessage(`当前已登录：${payload.currentPlayer.nickname}`);
        }
      } catch (loadError) {
        setError(loadError.message);
      }
    });
  }, [sessionPlayerId]);

  function updateForm(setter, key, value) {
    setter((current) => ({ ...current, [key]: value }));
  }

  async function submit(url, form, successText) {
    setError("");
    setMessage("");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "请求失败");
    }

    const refreshed = await readState();
    setAccounts(refreshed.accounts);
    setCurrentPlayer(refreshed.currentPlayer);
    setMessage(successText);

    return payload;
  }

  function handleLogin(event) {
    event.preventDefault();

    startTransition(async () => {
      try {
        await submit("/api/auth/login", loginForm, "登录成功");
        window.location.href = "/game";
      } catch (submitError) {
        setError(submitError.message);
      }
    });
  }

  function handleRegister(event) {
    event.preventDefault();

    startTransition(async () => {
      try {
        await submit("/api/auth/register", registerForm, "注册成功");
        window.location.href = "/game";
      } catch (submitError) {
        setError(submitError.message);
      }
    });
  }

  function fillAccount(nickname) {
    setLoginForm((current) => ({ ...current, nickname }));
    setMessage(`已填入账号 ${nickname}`);
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <p className="eyebrow">Alpha World MVP</p>
        <h1>登录本地主世界</h1>
        <p className="hero-copy">
          当前版本优先跑通单机式经营闭环。你可以注册新账号，或者切换到已有本地账号继续经营。
        </p>
        {currentPlayer ? (
          <div className="status-card">
            <span>当前账号</span>
            <strong>{currentPlayer.nickname}</strong>
            <Link href="/game" className="primary-link">
              进入游戏
            </Link>
          </div>
        ) : null}
      </section>

      <section className="auth-columns">
        <form className="panel" onSubmit={handleLogin}>
          <div className="panel-head">
            <h2>登录</h2>
            <p>输入昵称和密码，继续当前存档。</p>
          </div>

          <label>
            <span>昵称</span>
            <input
              value={loginForm.nickname}
              onChange={(event) =>
                updateForm(setLoginForm, "nickname", event.target.value)
              }
              placeholder="demo-player"
            />
          </label>

          <label>
            <span>密码</span>
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) =>
                updateForm(setLoginForm, "password", event.target.value)
              }
              placeholder="至少 6 位"
            />
          </label>

          <button className="button button-primary" disabled={isPending}>
            {isPending ? "处理中..." : "登录"}
          </button>
        </form>

        <form className="panel" onSubmit={handleRegister}>
          <div className="panel-head">
            <h2>注册</h2>
            <p>创建一个新本地账号，初始化金币和体力。</p>
          </div>

          <label>
            <span>昵称</span>
            <input
              value={registerForm.nickname}
              onChange={(event) =>
                updateForm(setRegisterForm, "nickname", event.target.value)
              }
              placeholder="new-landlord"
            />
          </label>

          <label>
            <span>密码</span>
            <input
              type="password"
              value={registerForm.password}
              onChange={(event) =>
                updateForm(setRegisterForm, "password", event.target.value)
              }
              placeholder="至少 6 位"
            />
          </label>

          <button className="button button-secondary" disabled={isPending}>
            {isPending ? "处理中..." : "注册并进入游戏"}
          </button>
        </form>

        <div className="panel accounts-panel">
          <div className="panel-head">
            <h2>本地账号</h2>
            <p>点击填充昵称，然后输入密码即可快速切换。</p>
          </div>

          <div className="account-list">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                className="account-card"
                onClick={() => fillAccount(account.nickname)}
              >
                <strong>{account.nickname}</strong>
                <span>
                  金币 {account.coins} · 地块 {account.tileCount} · 在线{" "}
                  {account.id === currentPlayer?.id ? "当前" : "待切换"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? <p className="message error">{error}</p> : null}
      {message ? <p className="message success">{message}</p> : null}
    </main>
  );
}

