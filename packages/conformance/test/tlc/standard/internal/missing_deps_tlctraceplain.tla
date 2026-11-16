(*---
description: _TLCTracePlain instances modules from the CommunityModules, which the TLC jar does not ship, so the import fails.
ref: tla2sany/StandardModules/_TLCTracePlain.tla
features:
  - _TLCTracePlain
outcome: parse-error
---*)
---- MODULE missing_deps_tlctraceplain ----
EXTENDS _TLCTracePlain
Test == TRUE
ASSUME Test
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file missing_deps_tlctraceplain
    | In module _TLCTracePlain
    | Cannot find source file for module IOUtils imported in module _TLCTracePlain.
    | *** Errors: 1
    | In module _TLCTracePlain
    | Cannot find source file for module IOUtils imported in module _TLCTracePlain.
    3002:1 Parsing or semantic analysis failed.
---*)
