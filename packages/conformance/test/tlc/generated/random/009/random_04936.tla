(*---
description: Evaluates a random record expression, seed 262, number 4936.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04936 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((~(\E b7680 \in SUBSET {1} : FALSE)) /\ (Len(<<>>) = Head(<<>>))) EXCEPT !.a = @ + Len(LET b7681 == LET b7682 == 0 IN b7682 IN (b7681 * b7681))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
