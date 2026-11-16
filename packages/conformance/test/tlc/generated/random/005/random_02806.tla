(*---
description: Evaluates a random record expression, seed 262, number 2806.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02806 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SubSeq(Tail(<<3, 1, 2>>), ([a |-> 1, b |-> TRUE]).a, ([a |-> 1]).a)), b |-> ({(b4455 + b4455) : b4455 \in ({} \cap Nat)} \subseteq {([a |-> 1]).a, (-7)})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> TRUE]"
---*)
