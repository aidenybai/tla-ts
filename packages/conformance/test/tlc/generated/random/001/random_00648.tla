(*---
description: Evaluates a random set expression, seed 262, number 648.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00648 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(IF {1, 2} THEN 2147483647 ELSE 2147483647 % (2147483647 - -1)), ((1 * 1) % CASE TRUE -> 0 [] OTHER -> 7)} \cap ({b1084 \in {<<5, 6>> : b1085 \in {1, 2}} : ({1, 2} = 1..3)} \cap UNION {{3 : b1086 \in 2..1}, UNION {{1, 2}, {x \in 1..3 : x > 1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00648 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as the condition of an IF.
    line 14, col 19 to line 14, col 79 of module random_00648
---*)
