(*---
description: _TETraceLength is LOCAL to Toolbox, so a spec cannot refer to it.
ref: tla2sany/StandardModules/Toolbox.tla#_TETraceLength
features:
  - Toolbox
flags:
  - expression
contexts:
  - assume
outcome: parse-error
---*)
---- MODULE tetrace_length_is_local ----
EXTENDS Toolbox
Test == _TETraceLength = 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 9 to line 14, col 22 of module tetrace_length_is_local
    | Unknown operator: `_TETraceLength'.
    3002:1 Parsing or semantic analysis failed.
---*)
