(*---
description: Evaluates a random int expression, seed 262, number 9250.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09250 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-UNION {(({1, 2} \cap {x \in 1..3 : x > 1}) \cup {b14360 : b14360 \in {2, 1, 3}}), ((SUBSET {1} \cap {x \in 1..3 : x > 1}) \cup (TRUE .. 2))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09250 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
