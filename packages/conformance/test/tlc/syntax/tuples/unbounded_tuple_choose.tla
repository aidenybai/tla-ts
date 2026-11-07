(*---
description: "An unbounded CHOOSE of a tuple parses, and TLC refuses to evaluate it."
ref: "tla2sany/parser/TLAplusParser.java#UnboundOrBoundChoose"
features: [tuples]
outcome: evaluation-failure
---*)
---- MODULE unbounded_tuple_choose ----
ASSUME (CHOOSE <<x, y>> : x = 1) = 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 8, col 8 to line 8, col 36 of module unbounded_tuple_choose failed.
    TLC attempted to evaluate an unbounded CHOOSE.
    Make sure that the expression is of form CHOOSE x \in S: P(x).
    line 8, col 9 to line 8, col 31 of module unbounded_tuple_choose
---*)
