import json
import sys

import requests


def main():
    base = "http://10.60.245.43:8000"

    email = "faithadeniyi2026@gmail.com"
    password = "AllisonTest."

    plan_id = "plan_20260305_162927"
    milestone_id = 1
    task_id = 1

    r = requests.post(f"{base}/auth/login", json={"email": email, "password": password}, timeout=30)
    print("login status:", r.status_code)
    print("login body:", r.text)

    r.raise_for_status()
    token = r.json().get("access_token")
    if not token:
        print("No access_token returned; cannot continue.")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}
    t = requests.patch(
        f"{base}/goals/{plan_id}/check/{milestone_id}/{task_id}",
        headers=headers,
        timeout=30,
    )

    print("toggle status:", t.status_code)
    print("toggle body:", t.text)

    try:
        data = t.json()
        print("toggle json (pretty):")
        print(json.dumps(data, indent=2))
        print("streak field:", data.get("streak"))
    except Exception as exc:
        print("toggle json parse error:", exc)


if __name__ == "__main__":
    main()
