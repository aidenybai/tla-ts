(*---
description: Evaluates a random seq expression, seed 262, number 8500.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08500 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([Tail(Tail(<<>>)) EXCEPT ![1] = IF (\A b13164 \in SUBSET {1} : TRUE) THEN (2147483647 - 7) ELSE (-7)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08500 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
