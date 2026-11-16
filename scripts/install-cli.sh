#!/bin/sh
# Instala o OmniStudio CLI em ~/.local/bin (sem sudo).
set -eu

target="${HOME}/.local/bin"
mkdir -p "$target"
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

cp "${script_dir}/omnistudio.mjs" "${target}/omnistudio"
chmod +x "${target}/omnistudio"

echo "Instalado em ${target}/omnistudio"
case ":${PATH}:" in
  *":${target}:"*) ;;
  *) echo "Adicione ao PATH: export PATH=\"${target}:\$PATH\"" ;;
esac

echo "Login: omnistudio --login --email voce@exemplo.com --password '...'"
echo "Sessão remota: omnistudio --watch"
