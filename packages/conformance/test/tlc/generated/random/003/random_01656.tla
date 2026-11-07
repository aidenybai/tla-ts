(*---
description: Evaluates a random int expression, seed 262, number 1656.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01656 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b2642 \in ((2147483647 + 2) .. (-2)) : ((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3])) * CASE (({1} \cap Nat) \subseteq {b2643 \in {} : 1}) -> IF (TRUE /\ FALSE) THEN Len(<<3, 1, 2>>) ELSE CASE TRUE -> 3 [] OTHER -> 7 [] OTHER -> Len((3 % TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2
    2178:0 Overflow when computing 2147483647+2
---*)
