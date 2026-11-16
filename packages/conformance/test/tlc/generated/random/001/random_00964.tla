(*---
description: Evaluates a random function expression, seed 262, number 964.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00964 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1559 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE) |-> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] EXCEPT !.a = @ + Head(<<1>>)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00964 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
