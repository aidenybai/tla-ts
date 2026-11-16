(*---
description: Evaluates a random record expression, seed 262, number 3161.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03161 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [b5038 \in ({<<>> : b5039 \in {x \in 1..3 : x > 1}} \cup (1..3 \cup {1})) |-> ((CHOOSE f \in [{} -> {}] : TRUE))[LET b5040 == b5038 IN <<3, 1, 2>>]], b |-> ((~(CHOOSE r \in [a : 2..1] : TRUE)) => ((1 .. 2147483647) \cup (1..3 \cup {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03161 failed.
    Attempted to check equality of the function <<>> with the value:
    1
---*)
