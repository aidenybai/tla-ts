(*---
description: Evaluates a random function expression, seed 262, number 881.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00881 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(IF FALSE THEN 2147483647 ELSE 2 \div (0 * 0))) :> LET b1424 == ((-7) * ([a |-> 1, b |-> TRUE]).a) IN ((TRUE /\ FALSE) % ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
