(*---
description: Evaluates a random function expression, seed 262, number 4301.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04301 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6779 \in ({(3 % 2147483647), (2147483647 * 3)} \ {b6780 \in (Nat \cup {x \in 1..3 : x > 1}) : (2..1 \cup 2..1)}) |-> (([a |-> b6779, b |-> TRUE]).a % (IF FALSE THEN FALSE ELSE b6779 * (b6779 % b6779)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04301 failed.
    2178:0 Overflow when computing 2147483647*3
---*)
