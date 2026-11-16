(*---
description: Evaluates a random record expression, seed 262, number 5510.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05510 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (CHOOSE b8514 \in SUBSET {1} : TRUE), b |-> (FALSE /\ TRUE)] EXCEPT !.a = ((2147483647 \div 7) + (-1 * 1))] EXCEPT !.a = Len([SubSeq(<<3, 1, 2>>, 7, 0) EXCEPT ![1] = (1 - 1)])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 151 to line 14, col 175 of module random_05510
    | [a |-> 0, b |-> FALSE]
---*)
