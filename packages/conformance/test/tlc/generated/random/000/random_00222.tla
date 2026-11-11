(*---
description: Evaluates a random int expression, seed 262, number 222.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00222 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([[<<>> EXCEPT !.a = 7] EXCEPT !.a = Len(<<1, 2>>)]).a, b |-> (((FALSE \/ TRUE) => (7 = -1)) /\ (\A b359 \in (SUBSET {1} \cup SUBSET {1}) : (\E b360 \in {1} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00222 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
