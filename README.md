# BEACON404

BEACON404 is a browser-based fake terminal / cyberpunk puzzle interface.

Beacon 1.1 reframes the opening as an ancient spacecraft preservation terminal. The visitor wakes into a quiet shell with no boot history, an unknown identity, and a delayed full-browser video signal behind the terminal.

## Run Locally

Use the local project helper:

```bash
testbeacon
```

Local URL:

```text
http://localhost:3000
```

Do not deploy Beacon 1.1 from this branch of work.

## Project Structure

```text
package.json
server.js
README.md
public/
  index.html
  404.html
  css/
    styles.css
  js/
    background-video.js
    beacon-synth.js
    robot-dj.js
    terminal.js
  data/
    ascii-output.mp4
    commands.json
    ascii/
      signal-001.txt
```

The synth files remain in the repo for later phases, but Beacon 1.1 does not load the audio system.

## Beacon 1.1 Commands

Valid commands:

- `help`
- `system`
- `status`
- `scan`
- `access`
- `logs`
- `users`
- `tasks`
- `process`
- `network`

Unknown commands return a short refusal without extra suggestions.

Beacon 1.1.1 adds:

- inline prompt cursor behavior
- ASCII sweep transitions between command views
- command parameter restriction hook: `parameters restricted by [restricted]`
- temporary in-browser `leave a log` entries
- top-bar terminal collapse/open reset
- delayed auto-typed `help` hint
- randomized prompt ghost messages
- video telemetry and fictional `transcribe audio`
- first fake `admin override` PIN modal after two command menus

## Background Video System

The active background video controller lives at:

```text
public/js/background-video.js
```

The first video source is:

```text
public/data/ascii-output.mp4
```

Browser path:

```text
/data/ascii-output.mp4
```

The controller supports:

- horizontal and vertical video source selection
- muted autoplay after a delayed reveal
- rewind button
- ended-video tape rewind effect
- future sequence hooks for terminal/video synchronization
- placeholder overlay layer hooks for future animation systems
- updating telemetry stream over the video
- fictional partial transcription display

## Future Hooks

Beacon 1.1 intentionally keeps the future dashboard small and code-facing. The intended expansion points are:

- command-triggered video changes through `BeaconVideo.handleCommand`
- text/video sequence planning through `BeaconVideo.setSequence`
- animated overlay layers through `BeaconVideo.addOverlay`
- terminal beat playback through `BeaconTerminal`
