(*---
description: Evaluates a random bool expression, seed 262, number 1126.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01126 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b1802 \in {b1803 \in (CASE TRUE -> {2, 1, 3} [] OTHER -> 1 .. LET b1804 == -1 IN 2147483647) : (UNION {{2, 1, 3}, 2147483647} = {b1805 \in Nat : FALSE})} : Append(((CHOOSE r \in [a : 1..2] : TRUE) \o [<<1, 2>> EXCEPT ![1] = 1]), CASE (FALSE \/ FALSE) -> Len(<<1, 2>>) [] OTHER -> ([a |-> 1]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01126 failed.
    Attempted to compare integer 2147483647 with non-integer:
    {1, 2, 3}
---*)
