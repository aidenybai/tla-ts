(*---
description: Evaluates a random function expression, seed 262, number 4882.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04882 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7603 \in ({Head(<<>>) : b7604 \in ({1, 2} \ TRUE)} \ {b7605 \in (2..1 \cup SUBSET {1}) : (b7605 < b7605)}) |-> LET b7606 == LET b7607 == (-0) IN (TRUE * 7) IN ((0 \div [a |-> 1]) \div (b7606 * 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04882 failed.
    Attempted to check if the value:
    1
    is an element of the boolean TRUE
---*)
