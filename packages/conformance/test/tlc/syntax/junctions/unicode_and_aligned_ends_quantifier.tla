(*---
description: "An aligned ∧ is a new bullet of an ASCII /\\ list."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
outcome: parse-error
---*)
---- MODULE unicode_and_aligned_ends_quantifier ----
Test ==
  /\ \E z \in {1} : TRUE
  ∧ z = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 5 to line 10, col 5 of module unicode_and_aligned_ends_quantifier
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
