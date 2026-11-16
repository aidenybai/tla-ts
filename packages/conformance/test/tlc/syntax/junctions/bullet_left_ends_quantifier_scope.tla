(*---
description: A bullet left of the column ends the list and any quantifier inside it.
ref: "tla2sany/parser/JunctionListContext.java#isAboveCurrent"
features: [junctions]
outcome: parse-error
---*)
---- MODULE bullet_left_ends_quantifier_scope ----
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
    | line 10, col 6 to line 10, col 6 of module bullet_left_ends_quantifier_scope
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
