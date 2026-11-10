(*---
description: Evaluates a random set expression, seed 262, number 2154.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02154 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(Tail(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))), ((([x \in 1..2 |-> x] @@ <<5, 6>>) @@ (CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE)))[Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))]})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
