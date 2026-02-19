#!/usr/bin/env python3
"""
Measure Time To First Paint (TTFP) for TUI applications.

Spawns the command on a real PTY and measures wall-clock time
from fork to first byte of terminal output.

Usage:
    python3 scripts/ttfp.py <command> [args...]
    python3 scripts/ttfp.py --runs 20 lazygit
    python3 scripts/ttfp.py --compare lazygit lazyjj jjui "bun src/index.tsx"
"""

import argparse
import os
import pty
import select
import signal
import sys
import time


def measure_once(cmd, timeout=10.0):
    """Run cmd on a PTY, return ms to first output or None on timeout."""
    start = time.perf_counter_ns()
    pid, fd = pty.fork()

    if pid == 0:
        # Child: set up terminal environment so TUI apps render
        import struct
        import fcntl
        import termios

        os.environ.setdefault("TERM", "xterm-256color")

        winsize = struct.pack("HHHH", 24, 80, 0, 0)
        fcntl.ioctl(sys.stdout.fileno(), termios.TIOCSWINSZ, winsize)

        os.execvp(cmd[0], cmd)
        sys.exit(1)

    try:
        r, _, _ = select.select([fd], [], [], timeout)
        if r:
            os.read(fd, 1)
            return (time.perf_counter_ns() - start) / 1e6
        return None
    finally:
        # Close PTY fd before killing — TUI apps can block waitpid
        # if the fd is still open (they keep reading from the PTY)
        try:
            os.close(fd)
        except OSError:
            pass
        try:
            os.kill(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        try:
            os.waitpid(pid, 0)
        except ChildProcessError:
            pass


def measure(cmd, runs=10):
    """Run cmd multiple times and return sorted list of times in ms."""
    times = []
    for i in range(runs):
        ms = measure_once(cmd)
        if ms is not None:
            times.append(ms)
            sys.stderr.write(f"\r  run {i + 1}/{runs}: {ms:.0f}ms")
            sys.stderr.flush()
        else:
            sys.stderr.write(f"\r  run {i + 1}/{runs}: timeout")
            sys.stderr.flush()
    sys.stderr.write("\r" + " " * 40 + "\r")
    sys.stderr.flush()
    times.sort()
    return times


def format_stats(label, times):
    if not times:
        return f"{label:30s}  no successful runs"
    median = times[len(times) // 2]
    return f"{label:30s}  median={median:6.0f}ms  min={times[0]:.0f}ms  max={times[-1]:.0f}ms  (n={len(times)})"


def main():
    parser = argparse.ArgumentParser(description="Measure TUI time to first paint")
    parser.add_argument("--runs", type=int, default=10, help="Number of runs (default: 10)")
    parser.add_argument(
        "--compare",
        action="store_true",
        help="Compare multiple commands (each arg is a full command string)",
    )
    parser.add_argument("command", nargs=argparse.REMAINDER, help="Command to run")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Strip leading -- if present
    commands = args.command
    if commands and commands[0] == "--":
        commands = commands[1:]

    if args.compare:
        import shlex

        results = []
        for cmd_str in commands:
            cmd = shlex.split(cmd_str)
            sys.stderr.write(f"Benchmarking: {cmd_str}\n")
            times = measure(cmd, args.runs)
            results.append((cmd_str, times))

        print()
        print(f"{'Command':30s}  {'Median':>8s}  {'Min':>6s}  {'Max':>6s}")
        print("-" * 60)
        for label, times in sorted(results, key=lambda r: r[1][len(r[1]) // 2] if r[1] else float("inf")):
            print(format_stats(label, times))
    else:
        times = measure(commands, args.runs)
        print(format_stats(" ".join(commands), times))


if __name__ == "__main__":
    main()
