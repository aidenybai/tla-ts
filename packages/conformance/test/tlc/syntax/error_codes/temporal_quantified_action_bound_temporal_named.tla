(*---
description: 4314 fires when the temporal body comes through a definition.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_quantified_action_bound_temporal_named ----
VARIABLE v
Tmp == []v
A == \E x \in v' : Tmp
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 15 to line 10, col 16 of module temporal_quantified_action_bound_temporal_named
    | Action-level bound of quantified temporal formula.
    3002:1 Parsing or semantic analysis failed.
---*)
