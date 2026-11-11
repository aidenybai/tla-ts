(*---
description: Evaluates a random bool expression, seed 262, number 315.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00315 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b523 == [b524 \in Nat |-> b524] IN Cardinality(2..1) < ((-0) \div Len(<<1, 2>>))) <=> ((CASE FALSE -> TRUE [] OTHER -> 2 * CASE FALSE -> 2147483647 [] OTHER -> 2) = IF (CHOOSE r \in [a : {0} \cup {1}] : TRUE) THEN Cardinality({2, 1, 3}) ELSE IF FALSE THEN 0 ELSE 7)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00315 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 187 to line 14, col 285 of module random_00315
---*)
