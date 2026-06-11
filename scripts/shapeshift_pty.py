#!/usr/bin/env python3
"""
Runs `eero shapeshift` under a pseudo-terminal so the interactive confirmation
prompt can be auto-answered, and streams all output to stdout line-buffered.

The eero CLI refuses piped stdin for its confirmation prompt (it needs a real
TTY), so we allocate a PTY, watch the output, and write "y\\n" when we see the
confirmation prompt.

Usage:
  shapeshift_pty.py --to stage --eero SERIAL
  shapeshift_pty.py --to prod  --network NETWORK_ID [--user EMAIL]

Exits 0 on success, non-zero on failure/timeout.
"""
import argparse
import os
import pty
import select
import sys
import time

# Overall safety timeout (seconds). Shapeshift = OTA + reboot + heartbeat wait.
TIMEOUT = 900
# Phrases that indicate the CLI is asking for confirmation.
CONFIRM_HINTS = (b"[y/n]", b"proceed", b"continue?", b"confirm", b"are you sure")
# Phrases that indicate success.
SUCCESS_HINTS = (b"shapeshift complete", b"shapeshifted", b"done", b"success")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--to", required=True, choices=["stage", "prod"])
    parser.add_argument("--eero")
    parser.add_argument("--network")
    parser.add_argument("--user")
    args = parser.parse_args()

    cmd = ["eero", "shapeshift", "--to", args.to]
    if args.eero:
        cmd += ["--eero", args.eero]
    if args.network:
        cmd += ["--network", args.network]
    if args.user:
        cmd += ["--user", args.user]

    pid, fd = pty.fork()
    if pid == 0:
        # Child: exec the CLI. stdout/stderr go to the PTY.
        os.execvp(cmd[0], cmd)
        os._exit(127)  # unreachable

    start = time.time()
    pending = b""
    answered = False

    while True:
        if time.time() - start > TIMEOUT:
            sys.stdout.write("\n[shapeshift_pty] TIMEOUT after %ds\n" % TIMEOUT)
            sys.stdout.flush()
            try:
                os.kill(pid, 9)
            except OSError:
                pass
            return 124

        try:
            r, _, _ = select.select([fd], [], [], 1.0)
        except (OSError, ValueError):
            break

        if fd in r:
            try:
                data = os.read(fd, 4096)
            except OSError:
                break
            if not data:
                break

            sys.stdout.write(data.decode(errors="replace"))
            sys.stdout.flush()

            pending += data
            low = pending.lower()

            if not answered and any(h in low for h in CONFIRM_HINTS):
                os.write(fd, b"y\n")
                answered = True
                pending = b""
            elif len(pending) > 8192:
                pending = pending[-2048:]

    # Reap child and surface its exit status.
    try:
        _, status = os.waitpid(pid, 0)
        code = os.waitstatus_to_exitcode(status)
    except (ChildProcessError, OSError):
        code = 0
    return code


if __name__ == "__main__":
    sys.exit(main())
