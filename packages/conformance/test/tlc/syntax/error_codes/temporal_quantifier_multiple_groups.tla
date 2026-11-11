(*---
description: 4314 fires for a later bound group at action level.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_quantifier_multiple_groups ----
VARIABLE v
A == \E x \in {1}, y \in v' : []v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 26 to line 9, col 27 of module temporal_quantifier_multiple_groups
    | Action-level bound of quantified temporal formula.
    3002:1 Parsing or semantic analysis failed.
---*)
