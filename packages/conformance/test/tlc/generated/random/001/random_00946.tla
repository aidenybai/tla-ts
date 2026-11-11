(*---
description: Evaluates a random record expression, seed 262, number 946.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00946 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = ((-(1 + 1)) % CASE (<<1>> = [x \in 1..2 |-> x]) -> [b1523 \in {2, 1, 3} |-> b1523] [] OTHER -> (-7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00946 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -7
---*)
