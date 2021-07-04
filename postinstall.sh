if [[ "$OSTYPE" == "win32" ]]; then
  IF EXIST .git git config core.hooksPath ./.git-hooks
else
  [ -d .git ] && git config core.hooksPath ./.git-hooks
fi