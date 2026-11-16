(*---
description: Evaluates a random bool expression, seed 262, number 2470.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02470 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(({x \in 1..3 : x > 1} \subseteq {2, 1, 3}) - (b3886 % 0)) : b3886 \in [b3887 \in (2..1 \cap {1, 2}) |-> Head(<<3, 1, 2>>)]} = (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] \cup Tail(<<1>>)) \cup {b3888 \in (SUBSET {1} \ {1, 2}) : (TRUE => TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02470 failed.
    TLC encountered a non-enumerable quantifier bound
    <<>>.
    line 14, col 89 to line 14, col 140 of module random_02470
---*)
