(*---
description: Evaluates a random function expression, seed 262, number 2969.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02969 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE) EXCEPT ![(Len(<<3, 7>>) % [a |-> IF TRUE THEN 2147483647 ELSE 2147483647, b |-> (3 = <<5, 6>>)])] = (IF (FALSE \/ FALSE) THEN (CHOOSE b4711 \in {1, 2} : TRUE) ELSE LET b4712 == 0 IN 2147483647 * ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02969 failed.
    Attempted to check equality of integer 3 with non-integer:
    <<5, 6>>
---*)
