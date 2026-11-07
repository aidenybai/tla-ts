(*---
description: _TLAPlusCounterExample instances modules from the CommunityModules, which the TLC jar does not ship, so the import fails.
ref: tla2sany/StandardModules/_TLAPlusCounterExample.tla
features:
  - _TLAPlusCounterExample
outcome: parse-error
---*)
---- MODULE missing_deps_tlapluscounterexample ----
EXTENDS _TLAPlusCounterExample
Test == TRUE
ASSUME Test
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file missing_deps_tlapluscounterexample
    | In module _TLAPlusCounterExample
    | Cannot find source file for module IOUtils imported in module _TLAPlusCounterExample.
    | *** Errors: 1
    | In module _TLAPlusCounterExample
    | Cannot find source file for module IOUtils imported in module _TLAPlusCounterExample.
    3002:1 Parsing or semantic analysis failed.
---*)
