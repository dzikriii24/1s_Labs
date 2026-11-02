#!/bin/bash
# =========================================================================
# Intelligent Resource Management & Adaptive Optimization Watchdog
# Replaces crude kill -9 scripts with intelligent, CloudLinux-compliant pruning
# =========================================================================

LOCK_FILE="/tmp/intelligent-optimizer.lock"
OPTIMIZER_SCRIPT="/home/u1zh8984/oneslabs-backend/scripts/run_resource_optimizer.js"
NODE_BIN="/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"

# 1. Run the Intelligent Optimizer using node virtualenv if available
if [ -f "$NODE_BIN" ] && [ -f "$OPTIMIZER_SCRIPT" ]; then
    flock -n "$LOCK_FILE" "$NODE_BIN" "$OPTIMIZER_SCRIPT" >> /home/u1zh8984/tmp/optimizer.log 2>&1
    exit 0
fi

# 2. Fallback Safe Guard (Only if Node runner is unavailable)
USER="u1zh8984"
NPROC_THRESHOLD=85

CURRENT_PROCS=$(ps -u $USER --no-headers | wc -l)
if [ "$CURRENT_PROCS" -ge "$NPROC_THRESHOLD" ]; then
    # Strictly protect lsnode, node, mysqld, sshd, and passenger
    # Only prune stale sleep, tail, or dangling subshells via graceful SIGTERM
    STALE_PIDS=$(ps -u $USER -o pid=,args= | grep -E 'sleep|tail|defunct' | grep -vE 'lsnode|node|agent|index.js' | awk '{print $1}')
    for pid in $STALE_PIDS; do
        kill -15 $pid 2>/dev/null
    done
fi

