#!/bin/sh
# Instala o OmniStudio CLI em ~/.local/bin (sem sudo).
# Uso: sh scripts/install-cli.sh    (dentro do repositório)
#      sh install-cli.sh            (dentro do tar.gz da release, ao lado de omnistudio.mjs)
set -eu

target="${HOME}/.local/bin"
mkdir -p "$target"
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ -f "${script_dir}/omnistudio.mjs" ]; then
  source_file="${script_dir}/omnistudio.mjs"
elif [ -f "${script_dir}/../cli/omnistudio.mjs" ]; then
  source_file="${script_dir}/../cli/omnistudio.mjs"
else
  echo "omnistudio.mjs não encontrado ao lado de $0. Rode a partir do repositório ou do tar.gz da release." >&2
  exit 1
fi

cp "$source_file" "${target}/omnistudio"
chmod +x "${target}/omnistudio"

echo "Instalado em ${target}/omnistudio"
case ":${PATH}:" in
  *":${target}:"*) ;;
  *) echo "Adicione ao PATH: export PATH=\"${target}:\$PATH\"" ;;
esac

echo "Login por código (recomendado): omnistudio --pair"
echo "Login com senha:                omnistudio --login --email voce@exemplo.com --password '...'"
echo "Sessão remota:                  omnistudio --watch"
