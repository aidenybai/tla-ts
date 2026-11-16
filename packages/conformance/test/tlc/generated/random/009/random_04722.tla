(*---
description: Evaluates a random function expression, seed 262, number 4722.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04722 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = ((CASE FALSE -> -1 [] OTHER -> 7 * ([x \in 1..2 |-> x])[2147483647]) - ((CHOOSE f \in [{} -> {2, 1, 3}] : TRUE))[CASE FALSE -> 0 [] OTHER -> 1])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04722 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
