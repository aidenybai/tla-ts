(*---
description: Evaluates a random function expression, seed 262, number 8960.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08960 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(LET b13894 == ([a |-> 1]).a IN (7 \div 1) :> (([a |-> 1]).a % (SUBSET {1} = {x \in 1..3 : x > 1}))) EXCEPT ![IF ((FALSE = [a |-> 1, b |-> TRUE]) <=> (TRUE => <<>>)) THEN Head(<<-1, 2147483647>>) ELSE (Head([a |-> 1, b |-> TRUE]) % (7 \div 2147483647))] = Head(SortSeq((<<>> \o [x \in 1..2 |-> x]), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08960 failed.
    Attempted to check equality of the set {} with the value:
    2
---*)
