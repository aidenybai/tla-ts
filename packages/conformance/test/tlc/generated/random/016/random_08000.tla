(*---
description: Evaluates a random bool expression, seed 262, number 8000.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08000 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b12350 == (CHOOSE b12351 \in {1} : TRUE) IN (1 % b12350) = LET b12352 == (7 .. 2147483647) IN Head(<<3, 1, 2>>)) \/ (((SUBSET {1} \cap {1, 2}) \cup UNION {Nat, SUBSET {1}}) = ((SUBSET {1} \ {x \in 1..3 : x > 1}) \cap ({1} \cup {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08000 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
