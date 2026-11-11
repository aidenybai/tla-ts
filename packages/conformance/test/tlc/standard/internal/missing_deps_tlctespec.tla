(*---
description: _TLCTESpec instances modules from the CommunityModules, which the TLC jar does not ship, so the import fails.
ref: tla2sany/StandardModules/_TLCTESpec.tla
features:
  - _TLCTESpec
outcome: parse-error
---*)
---- MODULE missing_deps_tlctespec ----
EXTENDS _TLCTESpec
Test == TRUE
ASSUME Test
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file missing_deps_tlctespec
    | In module _TLCTESpec
    | Cannot find source file for module IOUtils imported in module _TLCTESpec.
    | *** Errors: 1
    | In module _TLCTESpec
    | Cannot find source file for module IOUtils imported in module _TLCTESpec.
    3002:1 Parsing or semantic analysis failed.
---*)
