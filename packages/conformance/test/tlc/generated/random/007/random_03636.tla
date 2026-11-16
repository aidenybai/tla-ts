(*---
description: Evaluates a random set expression, seed 262, number 3636.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03636 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len((<<3, b5744>> \o Append(<<1, 2>>, 7))) : b5744 \in {b5745 \in {(b5746 \div 3) : b5746 \in ({2, 1, 3} \cap {1})} : (\E b5747 \in (1..3 \cap Nat) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {5}"
---*)
