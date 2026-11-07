(*---
description: Evaluates a random seq expression, seed 262, number 802.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00802 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(([<<1, 2>> EXCEPT ![1] = 3] \o Tail(<<1>>)), LAMBDA e : e > 0), (((-1 * 2147483647) - ([a |-> 1, b |-> TRUE]).a) % Len(SortSeq(<<1>>, LAMBDA p, q : p < q))), (IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN CASE FALSE -> 2147483647 [] OTHER -> 2 ELSE (2 % 3) - CASE (7 < FALSE) -> (3 % FALSE) [] OTHER -> (2147483647 - 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    FALSE
    2266:0 The second argument of < should be an integer, but instead it is:
    FALSE
---*)
