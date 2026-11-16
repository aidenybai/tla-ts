(*---
description: Evaluates a random seq expression, seed 262, number 8834.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08834 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<IF (~{2, 1, 3}) THEN (-0) ELSE Cardinality(2..1), ([[a |-> 1] EXCEPT !.a = @ + [a |-> 1]]).a>> EXCEPT ![1] = (CASE (2 < 2) -> IF FALSE THEN 3 ELSE 2147483647 [] OTHER -> (TRUE <=> FALSE) * (CASE TRUE -> 2147483647 [] OTHER -> 2147483647 \div (2147483647 + 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08834 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a set of the form {e1, ... ,eN})
    line 14, col 23 to line 14, col 32 of module random_08834
---*)
