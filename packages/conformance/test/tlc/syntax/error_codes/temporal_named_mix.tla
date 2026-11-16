(*---
description: 4313 fires when both levels come through definitions.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_named_mix ----
VARIABLE v
Act == v'
Tmp == []v
A == Act /\ Tmp
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 6 to line 11, col 15 of module temporal_named_mix
    | \land has both temporal formula and action as arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
