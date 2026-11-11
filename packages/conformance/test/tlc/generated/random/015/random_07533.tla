(*---
description: Evaluates a random set expression, seed 262, number 7533.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07533 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([[a |-> 1] EXCEPT !.a = @ + 7]).a, Head(SelectSeq(<<1>>, LAMBDA e : e > 0))} \cap {b11611 \in {b11612 \in (1 .. 2147483647) : (2147483647 < 3)} : ((7 .. b11611) \subseteq ({1} \ b11611))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
