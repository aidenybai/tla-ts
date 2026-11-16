(*---
description: Evaluates a random set expression, seed 262, number 140.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00140 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE SortSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) -> ((b218 - b218) - [a |-> 2, b |-> FALSE]) [] OTHER -> Head((<<>> \o <<>>)) : b218 \in {({0 : b220 \in {2, 1, 3}}).a : b219 \in ((2147483647 .. 3) \ (Nat \cap Nat))}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
