(*---
description: Evaluates a random record expression, seed 262, number 890.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00890 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = (((SUBSET {1} \cap {x \in 1..3 : x > 1}) \cap DOMAIN [x \in Nat |-> x + 1]) \div ((CHOOSE b1436 \in 1..3 : FALSE) * Len(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00890 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
