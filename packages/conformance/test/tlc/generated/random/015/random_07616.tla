(*---
description: Evaluates a random bool expression, seed 262, number 7616.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07616 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (CHOOSE b11714 \in {-1, 7} : ({1} => FALSE)), b |-> (\A b11715 \in UNION {1..3, 1..3} : (b11715 \in 1..3))] = [[a |-> IF FALSE THEN -1 ELSE 2147483647, b |-> (TRUE => FALSE)] EXCEPT !.a = @ + ((2147483647 \div 0) - (-1 * 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07616 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 54 to line 14, col 65 of module random_07616
---*)
