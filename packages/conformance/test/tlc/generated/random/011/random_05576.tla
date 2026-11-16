(*---
description: Evaluates a random set expression, seed 262, number 5576.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05576 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b8630 \in DOMAIN (<<5, 6>> @@ <<5, 6>>) : (Len(<<1>>) < [a |-> b8630, b |-> FALSE])} \cup LET b8631 == LET b8632 == (3 * 2) IN (CHOOSE b8633 \in Nat : FALSE) IN LET b8634 == (b8631 % 2147483647) IN Head(TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05576 failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    [a |-> 1, b |-> FALSE]
---*)
