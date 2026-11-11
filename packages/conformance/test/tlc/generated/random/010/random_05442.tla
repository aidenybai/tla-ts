(*---
description: Evaluates a random function expression, seed 262, number 5442.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05442 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b8427 \in (({x \in 1..3 : x > 1} \cap Nat) \cup (-1 .. 2)) |-> (Len(<<3, 1, 2>>) \div Len(<<>>))] EXCEPT ![IF ((0 + 2147483647) < LET b8428 == 3 IN 2147483647) THEN (-(FALSE => FALSE)) ELSE (IF [a |-> 1, b |-> TRUE] THEN 2147483647 ELSE 1 - Head(<<>>))] = ([[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + LET b8429 == 7 IN 2]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05442 failed.
    2179:0 The second argument of \div is 0.
---*)
