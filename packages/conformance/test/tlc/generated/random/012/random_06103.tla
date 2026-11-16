(*---
description: Evaluates a random record expression, seed 262, number 6103.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06103 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((-1 \in 2..1) /\ (<<1>> = [x \in 1..2 |-> x])) EXCEPT !.a = ((2147483647 \div 1) * (CHOOSE b9390 \in {2, 1, 3} : FALSE))] EXCEPT !.a = Head(<<Len(<<>>), (-1)>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06103 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
