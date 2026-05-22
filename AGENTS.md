# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

WJoy is a **macOS-only** native Objective-C application that enables Nintendo Wii Remote (Wiimote) controllers to be used as virtual joystick/gamepad devices on macOS. It includes a macOS kernel extension (`.kext`), Bluetooth communication layer, and status-bar UI.

**Build system:** Xcode `.xcodeproj` files only — no Makefile, CMake, or other cross-platform build system exists.

### Platform Limitation

This codebase **cannot be fully built or run on Linux**. It depends on macOS-only frameworks: Cocoa, AppKit, IOKit, IOBluetooth, Carbon, and Security. The kernel extension (`WirtualJoy/`) additionally requires macOS kernel headers.

### What Works on Linux (Cloud Agent Environment)

- **GNUstep** is installed, providing open-source implementations of `Foundation.framework` and parts of `AppKit.framework`.
- **Objective-C syntax checking** works for ~60% of source files (those using only Foundation). Run with:
  ```
  . /usr/share/GNUstep/Makefiles/GNUstep.sh
  clang -c -fsyntax-only -fno-objc-arc \
    $(gnustep-config --objc-flags) \
    -I/usr/lib/gcc/x86_64-linux-gnu/13/include \
    -I<source_directory> \
    <file.m>
  ```
- **Full compilation and linking** works for Foundation-only modules (e.g., `OCLog/`). Use `-L/usr/lib/gcc/x86_64-linux-gnu/13 -lobjc -lgnustep-base` for linking.
- Files that use IOKit, IOBluetooth, AppKit, Carbon, or Security frameworks will fail to compile.

### Key Modules

| Module | Foundation-only? | Notes |
|--------|------------------|-------|
| `OCLog/` | Yes | Logging framework — compiles and runs on Linux |
| `VHID/` | Partially | HID descriptor logic is Foundation-only; device creation uses IOKit |
| `Wiimote/` | Partially | Data parsing (accelerometer, IR, extensions) is Foundation-only; Bluetooth transport uses IOBluetooth |
| `WirtualJoy/` | No | macOS kernel extension + privileged helper tool |
| `WJoy/` | No | Main app — uses AppKit, IOKit, all frameworks |
| `UserNotification/` | No | Uses AppKit for notification windows |
| `UpdateChecker/` | Partially | URL checking is Foundation-only; UI is AppKit |
| `DMGEULA/` | Partially | Path preprocessing is Foundation-only; resource handling uses Carbon |

### No Automated Tests

This project has **no test suite** (no XCTest, SenTestingKit, or other test framework). There are no CI/CD configurations. Validation is done through compilation and manual testing on macOS.

### No Linter Configuration

No linting tools are configured. Use `clang -fsyntax-only` for basic syntax validation as described above.
