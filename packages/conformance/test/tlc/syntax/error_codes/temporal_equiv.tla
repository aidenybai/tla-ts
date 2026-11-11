(*---
description: "4313 fires for \\equiv mixing action and temporal levels."
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_equiv ----
VARIABLE v
A == []v \equiv v'
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 18 of module temporal_equiv
    | \equiv has both temporal formula and action as arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
