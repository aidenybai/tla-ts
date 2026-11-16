(*---
description: Evaluates a random set expression, seed 262, number 7924.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07924 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(7 :> 2147483647) EXCEPT ![(CHOOSE b12233 \in {2, 1, 3} : FALSE)] = (-{1})])[(({} \ {2, 1, 3}) % IF FALSE THEN 2 ELSE 3)] .. (((2 % 7) % (CHOOSE b12234 \in Nat : TRUE)) \div (-[b12235 \in {1} |-> b12235]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07924 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 47 to line 14, col 81 of module random_07924
---*)
