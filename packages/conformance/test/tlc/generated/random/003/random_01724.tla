(*---
description: Evaluates a random bool expression, seed 262, number 1724.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01724 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), (-([a |-> 1]).a)} \subseteq {b2740 \in {b2741 \in (2147483647 .. 7) : (<<3, 1, 2>> = <<5, 6>>)} : ((TRUE => TRUE) \/ ({x \in 1..3 : x > 1} = 1..3))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
