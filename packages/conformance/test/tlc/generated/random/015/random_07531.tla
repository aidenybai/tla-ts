(*---
description: Evaluates a random set expression, seed 262, number 7531.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07531 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((Len(<<3, 1, 2>>) - LET b11608 == 3 IN -1) - (Head(<<1>>) - Cardinality({1, 2}))) : b11607 \in {Len(({1} \cap Nat)) : b11609 \in ((2..1 \ {x \in 1..3 : x > 1}) \ ({1} \cup {2, 1, 3}))}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
