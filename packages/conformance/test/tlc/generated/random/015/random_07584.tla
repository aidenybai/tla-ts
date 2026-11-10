(*---
description: Evaluates a random seq expression, seed 262, number 7584.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07584 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(SelectSeq(<<0, 1>>, LAMBDA e : e > 0), LET b11671 == (7 \div 2) IN ([a |-> 1]).a, ([b11672 \in Nat |-> b11672])[(0 - 0)]), ([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = Append(<<1>>, 7)]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<<<1, 7>>>>"
---*)
