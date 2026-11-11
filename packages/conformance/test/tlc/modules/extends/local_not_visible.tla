(*---
description: A LOCAL definition is not extended.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
includes: [FixLocal.tla]
outcome: parse-error
---*)
---- MODULE local_not_visible ----
EXTENDS FixLocal
Test == Hidden = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 9 to line 10, col 14 of module local_not_visible
    | Unknown operator: `Hidden'.
    3002:1 Parsing or semantic analysis failed.
---*)
