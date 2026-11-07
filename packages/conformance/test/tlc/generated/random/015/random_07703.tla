(*---
description: Evaluates a random function expression, seed 262, number 7703.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07703 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE) @@ ((Cardinality(2..1) \div (2147483647 \div 0)) :> ([b11873 \in {} |-> b11873])[LET b11874 == 7 IN 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
