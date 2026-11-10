(*---
description: Evaluates a random set expression, seed 262, number 8976.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08976 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1}) \cup (<<>> \o <<>>)) @@ [b13930 \in (-1 .. -1) |-> (CHOOSE b13931 \in {1, 2} : TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08976 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    {2, 3} \cup <<>>
---*)
