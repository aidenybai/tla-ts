(*---
description: Evaluates a random function expression, seed 262, number 5174.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05174 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({b8027 \in (Nat \cap {x \in 1..3 : x > 1}) : (FALSE \/ FALSE)}) :> (((-1) * Head(<<3, 1, 2>>)) % (IF 2 THEN 0 ELSE 7 \div IF FALSE THEN 7 ELSE 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05174 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 127 to line 14, col 172 of module random_05174
---*)
