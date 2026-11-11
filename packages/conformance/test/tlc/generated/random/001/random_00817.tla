(*---
description: Evaluates a random function expression, seed 262, number 817.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00817 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([<<-1, 3>> EXCEPT ![1] = IF TRUE THEN -1 ELSE 1])[([b1339 \in {1, 2} |-> -1])[Len(<<1, 2>>)]] :> CASE (<<1, -1>> = (-1 :> 0)) -> (-(-3)) [] OTHER -> Head(<<2, 7>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00817 failed.
    Attempted to access index -1 of tuple
    <<-1, 3>>
    which is out of bounds.
---*)
