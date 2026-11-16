(*---
description: Evaluates a random int expression, seed 262, number 643.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00643 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((CHOOSE b1073 \in (TRUE => FALSE) : (FALSE /\ TRUE)) \in {(b1074 = 7) : b1074 \in (SUBSET {1} \ [x \in 1..2 |-> x])}) -> (CHOOSE b1075 \in (DOMAIN 2 \ (1..3 \ SUBSET {1})) : (~(FALSE \/ TRUE))) [] OTHER -> IF [[[a |-> 1] EXCEPT !.a = 7] EXCEPT !.a = @ + IF FALSE THEN 2 ELSE 2147483647] THEN IF (2..1 \subseteq 2..1) THEN Len(<<3, 1, 2>>) ELSE ([a |-> 1]).a ELSE IF (~FALSE) THEN CASE TRUE -> 3 [] OTHER -> 2 ELSE LET b1076 == 1 IN b1076)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00643 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 23 to line 14, col 72 of module random_00643
---*)
