(*---
description: Evaluates a random set expression, seed 262, number 1556.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01556 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a * ([<<5, 6>> EXCEPT ![<<1>>] = 2] * (0 * 3))) .. (CHOOSE b2484 \in {b2485 \in (2..1 \cap {x \in 1..3 : x > 1}) : ([a |-> 1, b |-> TRUE] = b2485)} : ((2 - 2147483647) = Len(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01556 failed.
    Attempted to access tuple at a non integral index: <<1>>
---*)
