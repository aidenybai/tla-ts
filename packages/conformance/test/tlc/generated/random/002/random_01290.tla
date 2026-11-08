(*---
description: Evaluates a random bool expression, seed 262, number 1290.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01290 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b2054 \in ((3 :> 7) .. Len([a |-> 1, b |-> TRUE])) : ((SUBSET {1} \subseteq 2..1) /\ (TRUE => TRUE))) => (((<<1, 2>> \o <<1>>) = [b2055 \in {x \in 1..3 : x > 1} |-> 1]) <=> (DOMAIN [x \in Nat |-> x + 1] \subseteq DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01290 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
