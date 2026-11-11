(*---
description: "4310 fires when the box's argument is an action through a definition."
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_always_named_action ----
VARIABLE v
Act == v' = v
A == []Act
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 6 to line 10, col 10 of module temporal_always_named_action
    | [] followed by action not of form [A]_v.
    3002:1 Parsing or semantic analysis failed.
---*)
