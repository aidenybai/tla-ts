(*---
description: Evaluates a random set expression, seed 262, number 9472.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09472 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [(CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE) EXCEPT ![Head(SelectSeq(<<1>>, LAMBDA e : e > 0))] = ([[a |-> 1] EXCEPT !.a = -1]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 74 of module random_09472
    | {2}
---*)
