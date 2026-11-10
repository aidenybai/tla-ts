(*---
description: Evaluates a random int expression, seed 262, number 8920.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08920 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b13825 \in {CASE TRUE -> b13826 [] OTHER -> b13826 : b13826 \in {b13827 \in {1, 2} : TRUE}} |-> LET b13828 == (-b13825) IN LET b13829 == b13828 IN <<5, 6>>])[(LET b13830 == (<<3, 1, 2>> % 3) IN LET b13831 == 3 IN 2 + Len(Tail(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08920 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
