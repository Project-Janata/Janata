#!/usr/bin/env bash
set -euo pipefail

AVD_NAME="${JANATA_ANDROID_AVD:-Janata_Pixel_8_API_35}"
ANDROID_API="${JANATA_ANDROID_API:-35}"
ANDROID_DEVICE="${JANATA_ANDROID_DEVICE:-pixel_8}"
ANDROID_IMAGE="system-images;android-${ANDROID_API};google_apis;arm64-v8a"

if [ -z "${JAVA_HOME:-}" ] && [ -d "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
elif [ -z "${JAVA_HOME:-}" ] && [ -d "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home"
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
if [ -n "${JAVA_HOME:-}" ]; then
  export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
else
  export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="$ROOT_DIR/.context/android-emulator.log"
AVD_DIR="$HOME/.android/avd/${AVD_NAME}.avd"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    exit 1
  fi
}

ensure_avd() {
  require_cmd avdmanager
  require_cmd emulator

  if emulator -list-avds 2>/dev/null | grep -qx "$AVD_NAME"; then
    configure_avd
    return
  fi

  printf 'no\n' | avdmanager create avd \
    --force \
    --name "$AVD_NAME" \
    --package "$ANDROID_IMAGE" \
    --device "$ANDROID_DEVICE"
  configure_avd
}

set_avd_config() {
  local key="$1"
  local value="$2"
  local file="$AVD_DIR/config.ini"

  if grep -q "^${key}=" "$file"; then
    perl -0pi -e "s/^\\Q${key}\\E=.*/${key}=${value}/m" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >>"$file"
  fi
}

configure_avd() {
  [ -f "$AVD_DIR/config.ini" ] || return

  set_avd_config "avd.id" "$AVD_NAME"
  set_avd_config "avd.name" "$AVD_NAME"
  set_avd_config "disk.dataPartition.size" "2048M"
  set_avd_config "hw.ramSize" "1536"
  set_avd_config "sdcard.size" "128M"
}

configure_android_project() {
  local root_gradle_file="$ROOT_DIR/packages/frontend/android/build.gradle"
  local app_gradle_file="$ROOT_DIR/packages/frontend/android/app/build.gradle"
  local marker="force 'org.bouncycastle:bcprov-jdk15to18:1.81'"

  if [ -f "$root_gradle_file" ] && ! grep -q "$marker" "$root_gradle_file"; then
    perl -0pi -e 's/(allprojects \{\n)/$1  configurations.configureEach {\n    resolutionStrategy {\n      force '\''org.bouncycastle:bcprov-jdk15to18:1.81'\''\n      force '\''org.bouncycastle:bcutil-jdk15to18:1.81'\''\n    }\n  }\n\n/' "$root_gradle_file"
  fi

  if [ -f "$app_gradle_file" ] && ! grep -q "androidx.core:core-splashscreen" "$app_gradle_file"; then
    perl -0pi -e 's/(implementation\("com\.facebook\.react:react-android"\)\n)/$1    implementation("androidx.core:core-splashscreen:1.0.1")\n/' "$app_gradle_file"
  fi
}

wait_for_boot() {
  require_cmd adb
  local emulator_pid="${1:-}"

  for _ in $(seq 1 90); do
    if adb get-state >/dev/null 2>&1; then
      break
    fi
    if [ -n "$emulator_pid" ] && ! kill -0 "$emulator_pid" >/dev/null 2>&1; then
      echo "Emulator exited before adb connected. See $LOG_FILE" >&2
      tail -80 "$LOG_FILE" >&2 || true
      exit 1
    fi
    sleep 1
  done

  if ! adb get-state >/dev/null 2>&1; then
    echo "Timed out waiting for emulator adb connection. See $LOG_FILE" >&2
    tail -80 "$LOG_FILE" >&2 || true
    exit 1
  fi

  for _ in $(seq 1 180); do
    if [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; then
      adb shell input keyevent 82 >/dev/null 2>&1 || true
      echo "Android emulator is ready: $AVD_NAME"
      return
    fi
    if [ -n "$emulator_pid" ] && ! kill -0 "$emulator_pid" >/dev/null 2>&1; then
      echo "Emulator exited before Android finished booting. See $LOG_FILE" >&2
      tail -80 "$LOG_FILE" >&2 || true
      exit 1
    fi
    sleep 1
  done

  echo "Timed out waiting for emulator boot. See $LOG_FILE" >&2
  exit 1
}

case "${1:-doctor}" in
  doctor)
    echo "JAVA_HOME=${JAVA_HOME:-}"
    echo "ANDROID_HOME=$ANDROID_HOME"
    command -v java || true
    command -v adb || true
    command -v emulator || true
    command -v avdmanager || true
    emulator -list-avds 2>/dev/null || true
    df -h "$HOME"
    ;;
  emulator)
    ensure_avd
    mkdir -p "$(dirname "$LOG_FILE")"
    if pgrep -f "emulator.*-avd[ =]$AVD_NAME" >/dev/null 2>&1; then
      echo "Emulator already running: $AVD_NAME"
      emulator_pid=""
    else
      nohup emulator -avd "$AVD_NAME" -netdelay none -netspeed full -no-metrics -no-snapshot -no-boot-anim -memory 1536 -partition-size 2048 >"$LOG_FILE" 2>&1 &
      emulator_pid="$!"
      echo "Starting emulator: $AVD_NAME"
    fi
    wait_for_boot "$emulator_pid"
    ;;
  devices)
    require_cmd adb
    adb devices -l
    ;;
  install-latest)
    require_cmd eas
    "$0" emulator
    cd "$ROOT_DIR/packages/frontend"
    eas build:run --platform android --latest
    ;;
  run-app)
    "$0" emulator
    configure_android_project
    cd "$ROOT_DIR/packages/frontend"
    npx expo run:android --port "${JANATA_METRO_PORT:-8082}"
    ;;
  *)
    echo "Usage: $0 {doctor|emulator|devices|install-latest|run-app}" >&2
    exit 2
    ;;
esac
