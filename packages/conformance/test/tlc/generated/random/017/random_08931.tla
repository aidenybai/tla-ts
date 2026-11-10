(*---
description: Evaluates a random set expression, seed 262, number 8931.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08931 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b13851 \in 1..3 : TRUE} \cap (1..3 \cap {})) \cap {b13852 \in UNION {SUBSET {1}, Nat} : (TRUE => FALSE)}) \cap {Head(<<b13853, 7>>) : b13853 \in {b13854 \in {2147483647, 0} : ([a |-> 1, b |-> TRUE] = [a |-> 1])}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
