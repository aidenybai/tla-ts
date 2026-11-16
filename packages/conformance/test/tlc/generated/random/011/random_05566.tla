(*---
description: Evaluates a random set expression, seed 262, number 5566.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05566 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> 1 [] OTHER -> 2147483647 - (CHOOSE b8619 \in {} : FALSE)) .. IF (TRUE /\ FALSE) THEN (2147483647 + 7) ELSE (3 - 7)) \ LET b8620 == CASE (2147483647 .. 7) -> ([x \in Nat |-> x + 1])[0] [] OTHER -> IF FALSE THEN 7 ELSE 7 IN Head((TRUE \cup SUBSET {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05566 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    TRUE \cup {{}, {1}}
---*)
