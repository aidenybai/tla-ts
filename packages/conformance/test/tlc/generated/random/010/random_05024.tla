(*---
description: Evaluates a random int expression, seed 262, number 5024.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05024 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SubSeq(SubSeq([<<3, 1, 2>> EXCEPT ![1] = 2], (CHOOSE b7816 \in {1, 2} : TRUE), Cardinality({1, 2})), IF (Nat = FALSE) THEN CASE TRUE -> 3 [] OTHER -> 7 ELSE (-3), (CASE TRUE -> [x \in Nat |-> x + 1] [] OTHER -> 3 \div (-<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05024 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    FALSE
---*)
