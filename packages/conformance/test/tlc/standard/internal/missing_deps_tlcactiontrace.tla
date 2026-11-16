(*---
description: _TLCActionTrace instances modules from the CommunityModules, which the TLC jar does not ship, so the import fails.
ref: tla2sany/StandardModules/_TLCActionTrace.tla
features:
  - _TLCActionTrace
outcome: parse-error
---*)
---- MODULE missing_deps_tlcactiontrace ----
EXTENDS _TLCActionTrace
Test == TRUE
ASSUME Test
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file missing_deps_tlcactiontrace
    | In module _TLCActionTrace
    | Cannot find source file for module IOUtils imported in module _TLCActionTrace.
    | *** Errors: 1
    | In module _TLCActionTrace
    | Cannot find source file for module IOUtils imported in module _TLCActionTrace.
    3002:1 Parsing or semantic analysis failed.
---*)
