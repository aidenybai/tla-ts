(*---
description: Evaluates a random function expression, seed 262, number 8418.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08418 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b13024 \in {(2147483647 % 7), (CHOOSE b13025 \in {1, 2} : FALSE)} |-> LET b13026 == LET b13027 == 7 IN 7 IN Len(<<>>)] EXCEPT ![(Head(Tail(<<1, 2>>)) + LET b13028 == Len(<<3, 1, 2>>) IN (CHOOSE b13029 \in SUBSET {1} : TRUE))] = [[[a |-> 0, b |-> TRUE] EXCEPT !.a = LET b13030 == 0 IN b13030] EXCEPT !.a = @ + Head((<<>> \o <<3, 1, 2>>))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08418 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 49 to line 14, col 80 of module random_08418
---*)
