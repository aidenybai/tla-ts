(*---
description: Evaluates a random seq expression, seed 262, number 6245.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06245 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((-Cardinality(SUBSET {1})) * IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN Head({2, 1, 3}) ELSE CASE TRUE -> 7 [] OTHER -> 0), (LET b9615 == CASE FALSE -> -1 [] OTHER -> -1 IN Head(<<>>) + LET b9616 == (CHOOSE b9617 \in SUBSET {1} : TRUE) IN IF FALSE THEN 7 ELSE b9616)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06245 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
