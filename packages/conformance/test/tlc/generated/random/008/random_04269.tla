(*---
description: Evaluates a random record expression, seed 262, number 4269.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04269 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (\E b6722 \in {} : [a |-> 1]) -> LET b6723 == 2 IN b6723 [] OTHER -> (1 % 7), b |-> (CASE FALSE -> 7 [] OTHER -> 3 < (-7))] EXCEPT !.a = Len(SelectSeq(SubSeq(<<>>, 2147483647, -1), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> FALSE]"
---*)
