(*---
description: Evaluates a random function expression, seed 262, number 6816.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06816 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SubSeq(SelectSeq([a |-> 1, b |-> TRUE], LAMBDA e : e > 0), CASE TRUE -> 2 [] OTHER -> 0, (2 - -1)) @@ [a |-> ([x \in 1..2 |-> x])[3], b |-> (Nat \subseteq SUBSET {1})]) @@ (CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06816 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
