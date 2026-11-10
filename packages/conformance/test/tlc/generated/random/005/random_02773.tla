(*---
description: Evaluates a random function expression, seed 262, number 2773.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02773 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = LET b4379 == 0 IN 3] EXCEPT !.a = @ + CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> LET b4380 == -1 IN b4380 [] OTHER -> Cardinality(Nat)] @@ [[[b4381 \in 2..1 |-> 7] EXCEPT ![CASE FALSE -> <<1>> [] OTHER -> 0] = IF TRUE THEN 2147483647 ELSE 0] EXCEPT ![([a |-> 1, b |-> FALSE]).a] = ((-1 - 0) \div Cardinality({x \in 1..3 : x > 1}))]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 224 to line 14, col 245 of module random_02773
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 223 to line 14, col 323 of module random_02773
    | [a |-> 2]
---*)
