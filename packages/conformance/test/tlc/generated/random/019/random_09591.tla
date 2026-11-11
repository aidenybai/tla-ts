(*---
description: Evaluates a random set expression, seed 262, number 9591.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09591 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) <=> [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]) -> (([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))[IF FALSE THEN 0 ELSE TRUE] [] OTHER -> IF (FALSE <=> FALSE) THEN Len(<<>>) ELSE (3 + 0), IF ((2..1 \ {x \in 1..3 : x > 1}) \subseteq (\A b14894 \in {2, 1, 3} : TRUE)) THEN LET b14895 == (7 % 3) IN (0 \div 2) ELSE (IF FALSE THEN 0 ELSE 2147483647 + Cardinality({x \in 1..3 : x > 1}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09591 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 23 to line 14, col 116 of module random_09591
---*)
