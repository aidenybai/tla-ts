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
    2169:0 The first argument of @@ should be a function, but instead it is:
    {2, 3} \cup <<>>
    2169:0 The first argument of @@ should be a function, but instead it is:
    {2, 3} \cup <<>>
---*)
