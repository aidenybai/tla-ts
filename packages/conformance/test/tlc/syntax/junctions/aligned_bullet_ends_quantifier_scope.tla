(*---
description: "An aligned bullet ends the previous item, so the quantifier variable is out of scope."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
outcome: parse-error
---*)
---- MODULE aligned_bullet_ends_quantifier_scope ----
Test ==
  /\ \E z \in {1} : TRUE
  /\ z = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 6 to line 10, col 6 of module aligned_bullet_ends_quantifier_scope
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
