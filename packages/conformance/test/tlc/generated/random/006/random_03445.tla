(*---
description: Evaluates a random bool expression, seed 262, number 3445.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03445 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((1 \div 3) % LET b5462 == 2 IN b5461) : b5461 \in ({-1, 2147483647} \ ({1} \cup 2..1))} \subseteq (([a |-> 0, b |-> FALSE]).a .. IF ({1, 2} = Nat) THEN (2 % -1) ELSE Head({}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
