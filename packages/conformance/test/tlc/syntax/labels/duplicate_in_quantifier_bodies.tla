(*---
description: Quantifier bodies in one definition share a label set.
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
outcome: parse-error
---*)
---- MODULE duplicate_in_quantifier_bodies ----
Op == (\A x \in {1} : l(x):: TRUE) /\ (\A y \in {1} : l(y):: TRUE)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 55 to line 8, col 65 of module duplicate_in_quantifier_bodies
    | Duplicate label `l'.
    3002:1 Parsing or semantic analysis failed.
---*)
