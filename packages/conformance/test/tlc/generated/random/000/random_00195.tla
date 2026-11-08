(*---
description: Evaluates a random record expression, seed 262, number 195.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00195 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b318 == IF (\E b319 \in {2, 1, 3} : [x \in 1..2 |-> x]) THEN LET b320 == 2147483647 IN 1 ELSE IF TRUE THEN 2 ELSE 2 IN ((-b318) % [[x \in 1..2 |-> x] EXCEPT ![TRUE] = b318]), b |-> (\E b321 \in ((-[a |-> 1]) .. ([a |-> 1]).a) : (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) /\ (2147483647 \in {})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00195 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 39 to line 14, col 80 of module random_00195
---*)
