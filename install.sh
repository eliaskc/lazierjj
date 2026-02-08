#!/usr/bin/env bash
# Redirect to canonical URL — kept for backward compatibility
exec curl -fsSL https://kajji.sh/install.sh | bash -s -- "$@"
