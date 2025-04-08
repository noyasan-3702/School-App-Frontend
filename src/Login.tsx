import { Box, Button, Center, Field, Heading, Input, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "http://localhost:3001";

function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Node.js の /api/login にパスワードを送信
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError("パスワードを入力してください");
      return;
    }

    try {
      // 🔥 /api/login に POST リクエスト
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        setError("");
        onLogin();
        navigate("/Dashboard");
      } else {
        setError(data.error || "ログインに失敗しました");
      }
    } catch (err) {
      console.error("ログインエラー:", err);
      setError("ログイン中にエラーが発生しました");
    }
  };

  return (
    <Center minH="100vh" bg="gray.50">
      <Box bg="white" p={8} rounded="md" shadow="md" width="100%" maxW="sm">
        <Stack gap={6}>
          <Heading as="h1" size="lg" textAlign="center">
            ログインページ
          </Heading>
          <form onSubmit={handleLogin}>
            <Stack gap={4}>
              <Field.Root>
                <Field.Label>
                  パスワード
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  _invalid={{ borderColor: "red.500", boxShadow: "0 0 0 1px red" }}
                  aria-invalid={error ? "true" : undefined}
                />
                <Field.HelperText>管理者専用のパスワードを入力してください。</Field.HelperText>
                {error && <Field.ErrorText>{error}</Field.ErrorText>}
              </Field.Root>

              <Button type="submit" colorScheme="blue" width="full">
                ログイン
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
    </Center>
  );
}

export default Login;
