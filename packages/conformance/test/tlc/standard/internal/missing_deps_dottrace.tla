(*---
description: _DotTrace instances modules from the CommunityModules, which the TLC jar does not ship, so the import fails.
ref: tla2sany/StandardModules/_DotTrace.tla
features:
  - _DotTrace
outcome: parse-error
---*)
---- MODULE missing_deps_dottrace ----
EXTENDS _DotTrace
Test == TRUE
ASSUME Test
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file missing_deps_dottrace
    | In module _DotTrace
    | Cannot find source file for module GraphViz imported in module _DotTrace.
    | *** Errors: 1
    | In module _DotTrace
    | Cannot find source file for module GraphViz imported in module _DotTrace.
    3002:1 Parsing or semantic analysis failed.
---*)
