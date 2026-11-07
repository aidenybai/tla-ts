(*---
description: Evaluates a random function expression, seed 262, number 4235.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04235 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b6660 \in ((1 \div 0) \cap ({} \cup {1})) |-> ((1 * 1) + Cardinality(SUBSET {1}))] @@ (([[a |-> 1] EXCEPT !.a = 1]).a :> (LET b6661 == 0 IN b6661 \div (-1 - 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
