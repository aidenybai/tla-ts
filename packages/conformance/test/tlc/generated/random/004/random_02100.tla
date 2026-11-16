(*---
description: Evaluates a random int expression, seed 262, number 2100.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02100 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b3337 \in {2, 1, 3} |-> -1])[(7 * 0)] + IF ({2, 1, 3} \subseteq 2..1) THEN (-1 \div 0) ELSE (1 % 2)) % <<((CHOOSE b3338 \in {2, 1, 3} : TRUE) + (-2147483647)), (-(-3))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02100 failed.
    In applying the function
    <<-1, -1, -1>>,
    the first argument is:
    0
    which is not in its domain.
---*)
