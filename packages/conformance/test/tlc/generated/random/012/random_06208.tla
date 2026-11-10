(*---
description: Evaluates a random bool expression, seed 262, number 6208.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06208 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF SortSeq(<<1>>, LAMBDA p, q : p < q) THEN (TRUE = <<5, 6>>) ELSE ([a |-> 1, b |-> TRUE]).a .. (CHOOSE b9558 \in {7 : b9559 \in 2..1} : ({x \in 1..3 : x > 1} \subseteq Nat))) \subseteq {(IF FALSE THEN 2147483647 ELSE 7 % (b9560 :> b9560)) : b9560 \in {b9561 \in ({1, 2} \ 1..3) : (TRUE \in {1})}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06208 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 18 to line 14, col 191 of module random_06208
---*)
