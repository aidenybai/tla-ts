(*---
description: Evaluates a random set expression, seed 262, number 5230.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05230 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((0 + 2) % (7 - 3)), ((2147483647 \div 7) + IF (1 :> 2) THEN 3 ELSE 3)} \cup ({b8103 \in {2, 1} : ([a |-> 1] = [a |-> 1, b |-> TRUE])} \ {Cardinality(Nat), ([a |-> 1]).a})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05230 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as the condition of an IF.
    line 14, col 62 to line 14, col 86 of module random_05230
---*)
