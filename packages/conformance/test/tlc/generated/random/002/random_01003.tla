(*---
description: Evaluates a random int expression, seed 262, number 1003.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01003 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 2147483647, b |-> FALSE] EXCEPT !.a = (<<3, 1, 2>>)[-1]]).a * ((\A b1612 \in DOMAIN (1 :> 2) : <<-1, b1612>>) /\ (({1} \subseteq 2..1) /\ (TRUE => TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01003 failed.
    Attempted to access index -1 of tuple
    <<3, 1, 2>>
    which is out of bounds.
---*)
