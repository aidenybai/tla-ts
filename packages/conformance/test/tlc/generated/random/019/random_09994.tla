(*---
description: Evaluates a random int expression, seed 262, number 9994.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09994 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = @ + LET b15536 == 7 IN b15536] EXCEPT !.a = (CHOOSE b15537 \in {1, 7} : (b15537 \in SUBSET {1}))] EXCEPT !.a = (CASE (FALSE \/ FALSE) -> (2 % 3) [] OTHER -> ([a |-> 1] @@ [x \in Nat |-> x + 1]) + ((CHOOSE b15538 \in 1..3 : TRUE) % IF FALSE THEN 0 ELSE 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09994 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
