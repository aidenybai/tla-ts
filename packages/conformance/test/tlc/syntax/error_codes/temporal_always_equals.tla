(*---
description: 4310 fires for an equality on a prime.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_always_equals ----
VARIABLE v
A == [](v' = v)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 15 of module temporal_always_equals
    | [] followed by action not of form [A]_v.
    3002:1 Parsing or semantic analysis failed.
---*)
