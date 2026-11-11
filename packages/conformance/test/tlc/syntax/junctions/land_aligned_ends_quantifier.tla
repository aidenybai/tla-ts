(*---
description: "An aligned \\land is a new bullet, ending the previous item's quantifier."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
outcome: parse-error
---*)
---- MODULE land_aligned_ends_quantifier ----
Test ==
  /\ \E z \in {1} : TRUE
  \land z = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 9 to line 10, col 9 of module land_aligned_ends_quantifier
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
