(*---
description: Evaluates a random set expression, seed 262, number 1134.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01134 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(LET b1816 == ([x \in 1..2 |-> x])[7] IN Len(<<>>) - CASE (FALSE \/ TRUE) -> Head([a |-> 1]) [] OTHER -> (-2147483647)), [a |-> (LET b1817 == 2 IN b1817 * Head(<<3, 1, 2>>)), b |-> ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [a |-> 2, b |-> FALSE])]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01134 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
---*)
