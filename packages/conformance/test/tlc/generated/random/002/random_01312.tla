(*---
description: Evaluates a random function expression, seed 262, number 1312.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01312 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {DOMAIN [<<5, 6>> EXCEPT ![(1 :> 2)] = 0], DOMAIN [3 EXCEPT ![3] = 1]} \cup {(IF TRUE THEN 2 ELSE b2091 .. (7 + b2091)) : b2091 \in ({b2092 \in Nat : TRUE} \cup ({1} \cap {1, 2}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01312 failed.
    Attempted to access tuple at a non integral index: <<2>>
---*)
