(*---
description: Evaluates a random bool expression, seed 262, number 6455.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06455 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b9934 \in UNION {{2147483647, -1}, (3 .. 1)} : (({1} \cup {2, 1, 3}) \subseteq {b9935 \in 2..1 : TRUE})) < LET b9936 == (SubSeq(<<1, 2>>, 1, -1) % Len(<<3, 1, 2>>)) IN (Head(<<1>>) * CASE [a |-> 1] -> 2147483647 [] OTHER -> 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06455 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 127 of module random_06455
---*)
