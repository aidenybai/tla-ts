(*---
description: Evaluates a random int expression, seed 262, number 2106.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02106 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\A b3343 \in ((TRUE <=> TRUE) <=> (FALSE <=> TRUE)) : (\A b3344 \in (b3343 .. TRUE) : (Nat = {}))) THEN (([1..3 EXCEPT ![3] = 3] @@ (TRUE @@ [a |-> 1])))[(-Len([a |-> 1, b |-> TRUE]))] ELSE (([[a |-> 1] EXCEPT !.a = @ + 2147483647]).a * (LET b3345 == 3 IN b3345 \div IF TRUE THEN 1 ELSE 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02106 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 34 to line 14, col 69 of module random_02106
---*)
