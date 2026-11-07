(*---
description: Evaluates a random bool expression, seed 262, number 2372.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02372 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b3755 \in ((Head(<<1>>) \div (-0)) .. ((-3) % (-1 + 7))) : [a |-> (Head(<<3, 1, 2>>) % Len(<<1>>)), b |-> ((FALSE \/ TRUE) <=> (b3755 < b3755))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
