(*---
description: Evaluates a random set expression, seed 262, number 2031.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02031 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b3223 \in {b3224 \in {1, 2} : TRUE} : (TRUE /\ TRUE)} \ DOMAIN ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x])) \cap (({b3225 \in {1} : FALSE} \cup {1..3, -1}) \cap {Head(<<>>), Len(<<1>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02031 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
