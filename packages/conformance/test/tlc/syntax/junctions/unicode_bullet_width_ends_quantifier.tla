(*---
description: "With ∧ one column wide, a bullet two columns right of it aligns with the inner list."
ref: "tla2sany/parser/JunctionListContext.java#Column"
features: [junctions]
outcome: parse-error
---*)
---- MODULE unicode_bullet_width_ends_quantifier ----
Test ==
  ∧ ∧ \E z \in {1} : TRUE
    ∧ z = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 7 to line 10, col 7 of module unicode_bullet_width_ends_quantifier
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
