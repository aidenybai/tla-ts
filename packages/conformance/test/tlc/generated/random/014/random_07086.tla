(*---
description: Evaluates a random set expression, seed 262, number 7086.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07086 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE r \in [a : {}] : TRUE)).a % Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))) : b10881 \in (Head(Tail(<<>>)) \ DOMAIN (CHOOSE b10882 \in 1..3 : FALSE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
