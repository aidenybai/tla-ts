(*---
description: Evaluates a random bool expression, seed 262, number 347.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00347 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b578 \in ((({} \cap Nat) \cap {FALSE, 1}) \cap {(1 % 7), Head(<<1>>)}) : (((<<>> = (1 :> 2)) => (<<1, 2>> = [x \in Nat |-> x + 1])) <=> ((-1 = -1) <=> (<<5, 6>> = 1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
