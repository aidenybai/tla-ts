(*---
description: Evaluates a random record expression, seed 262, number 9698.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09698 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(Tail(Tail(<<>>)), ((2 % 7) \div LET b15046 == 2 IN b15046), Head(SubSeq(<<>>, 2147483647, -1))) EXCEPT !.a = (Append(<<2, 1>>, Cardinality({1})) * (-(CHOOSE b15047 \in [a |-> 1] : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09698 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
