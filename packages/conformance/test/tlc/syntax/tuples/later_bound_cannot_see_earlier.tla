(*---
description: "A later bound's set cannot use an earlier bound name, since bounds are generated before names are added."
ref: "tla2sany/semantic/Generator.java#processQuantBoundArgs"
features: [tuples]
outcome: parse-error
---*)
---- MODULE later_bound_cannot_see_earlier ----
Test == \A x \in {1}, y \in {x} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 30 to line 8, col 30 of module later_bound_cannot_see_earlier
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
