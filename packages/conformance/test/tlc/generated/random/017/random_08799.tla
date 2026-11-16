(*---
description: Evaluates a random set expression, seed 262, number 8799.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08799 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality((2 .. -1)) + IF (SUBSET {1} \subseteq {2, 1, 3}) THEN (CHOOSE b13634 \in {} : FALSE) ELSE Len(<<>>)) .. (-CASE (\E b13635 \in {2, 1, 3} : FALSE) -> CASE TRUE -> 1 [] OTHER -> 0 [] OTHER -> Len(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08799 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
