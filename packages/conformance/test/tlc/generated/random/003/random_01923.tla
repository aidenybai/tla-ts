(*---
description: Evaluates a random int expression, seed 262, number 1923.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01923 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (~((TRUE => TRUE) => (2147483647 \/ FALSE))) THEN (([b3019 \in {x \in 1..3 : x > 1} |-> 2147483647])[CASE TRUE -> 0 [] OTHER -> 7] - (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE)) ELSE (-([b3020 \in {1, 2} |-> 2147483647])[LET b3021 == 2 IN 0]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01923 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    an integer.
    line 14, col 41 to line 14, col 59 of module random_01923
---*)
