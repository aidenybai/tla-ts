(*---
description: "A comment before a bullet moves it, so a bullet after a comment can align with one after spaces."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
outcome: parse-error
---*)
---- MODULE comment_counts_toward_column ----
Test ==
        /\ \E z \in {1} : TRUE
(* c *) /\ z = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 12 to line 10, col 12 of module comment_counts_toward_column
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
