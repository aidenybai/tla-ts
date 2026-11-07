(*---
description: Evaluates a random seq expression, seed 262, number 9395.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09395 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(Tail((<<>> \o <<>>)), Head([<<1>> EXCEPT ![1] = 0]), (Len(<<1>>) % ([a |-> 1, b |-> TRUE]).a)), CASE (\E b14578 \in {b14579 \in 0 : FALSE} : (~TRUE)) -> (IF <<>> THEN -1 ELSE 1 % ([x \in Nat |-> x + 1])[-1]) [] OTHER -> (IF FALSE THEN 3 ELSE 0 % Len(<<1, 2>>)), (LET b14580 == Cardinality({}) IN ([a |-> 1, b |-> TRUE]).a - [[b14581 \in 2..1 |-> b14581] EXCEPT ![(1 + -1)] = IF FALSE THEN 3 ELSE 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
