(*---
description: "An unbounded \\E parses, and TLC refuses to evaluate it."
ref: "tla2sany/parser/TLAplusParser.java#SomeQuant"
features: [tuples]
outcome: evaluation-failure
---*)
---- MODULE unbounded_exists_parses ----
ASSUME \E x : TRUE
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 8, col 8 to line 8, col 18 of module unbounded_exists_parses failed.
    TLC attempted to evaluate an unbounded \E.
    Make sure that the expression is of form \E x \in S: P(x).
    line 8, col 8 to line 8, col 18 of module unbounded_exists_parses
---*)
