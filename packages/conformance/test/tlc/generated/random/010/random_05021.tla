(*---
description: Evaluates a random bool expression, seed 262, number 5021.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05021 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [a |-> Len(<<>>), b |-> (\E b7813 \in 1..3 : FALSE)]) \/ ({Len(<<3, 1, 2>>) : b7814 \in (2..1 \ 1..3)} = (Tail(<<1, 2>>) \cap {2147483647, <<1, 2>>}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05021 failed.
    Attempted to check set membership in a tuple value.
---*)
