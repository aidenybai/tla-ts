(*---
description: Evaluates a random set expression, seed 262, number 3211.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03211 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(-1 - 2147483647), (7 + -1)}, (({1} \cap SUBSET {1}) \cap (3 .. -1))} \cup (DOMAIN (7 :> -1) \ (IF TRUE THEN 0 ELSE 2 .. ((1 :> 2))[<<1, 2>>]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03211 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
