(*---
description: Evaluates a random record expression, seed 262, number 5727.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05727 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SelectSeq([<<1>> EXCEPT ![1] = 1], LAMBDA e : e > 0)), b |-> ({(-7), IF FALSE THEN 2147483647 ELSE 7} = {(b8811 % b8811) : b8811 \in (2147483647 .. 7)})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> FALSE]"
---*)
