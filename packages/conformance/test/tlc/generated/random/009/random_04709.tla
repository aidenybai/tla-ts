(*---
description: Evaluates a random bool expression, seed 262, number 4709.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04709 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Head(<<>>)) < Len([<<3, 1, 2>> EXCEPT ![1] = 2147483647])) /\ ((CHOOSE b7368 \in (-1 .. 3) : (TRUE \/ TRUE)) \in (Len(<<>>) .. (7 + 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04709 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
