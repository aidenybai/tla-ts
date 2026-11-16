(*---
description: Evaluates a random set expression, seed 262, number 9194.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09194 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b14264 \in ({Head(<<3, 1, 2>>), IF TRUE THEN 1 ELSE 1} \cap {(-1 \div 2147483647), (CHOOSE b14265 \in {1} : TRUE)}) : ((({1} \cup {1}) = DOMAIN [x \in Nat |-> x + 1]) => ((TRUE => FALSE) \/ [[a |-> 1] EXCEPT !.a = 1]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09194 failed.
    Attempted to check equality of the set {1} with the value:
    Nat
---*)
