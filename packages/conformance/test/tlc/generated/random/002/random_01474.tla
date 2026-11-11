(*---
description: Evaluates a random int expression, seed 262, number 1474.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01474 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 + 7) \div IF FALSE THEN 1 ELSE 7) \div Head(Append(<<3, 1, 2>>, 7))) - IF (\A b2355 \in (1..3 \ SUBSET {1}) : (b2355 = {1})) THEN CASE (FALSE \/ TRUE) -> LET b2356 == 2 IN b2356 [] OTHER -> CASE TRUE -> 7 [] OTHER -> 1..3 ELSE LET b2357 == (-[a |-> 1, b |-> TRUE]) IN (CHOOSE b2358 \in {1} : FALSE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01474 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
