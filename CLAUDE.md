# RTK Integration (Rust Token Killer)

Always use the `rtk` prefix for terminal commands to save tokens. This is especially important on Windows where automatic hooks are not supported.

## Guidelines
- Use `rtk git status` instead of `git status`
- Use `rtk npm test` or `rtk npm run dev` (if output is verbose)
- Use `rtk ls -R` or `rtk find` instead of standard listing for large directories
- Use `rtk grep` instead of built-in grep for large searches

## Commands to use with RTK:
- `git`
- `npm`
- `ls`, `dir`, `find`, `grep`
- `cat`, `type`
