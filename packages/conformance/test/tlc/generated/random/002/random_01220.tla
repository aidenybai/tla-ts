(*---
description: Evaluates a random bool expression, seed 262, number 1220.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01220 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 3, b |-> FALSE] EXCEPT !.a = (1 + 0)] \ (({1, 2} \cap 2..1) \ ([a |-> 1] \ {}))) \subseteq ({(0 + 0), (2147483647 - 3)} \cap {Len(<<>>), IF TRUE THEN -1 ELSE -1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01220 failed.
    Attempted to enumerate S \ T when S:
    [a |-> 1, b |-> FALSE]
    is not enumerable.
---*)
