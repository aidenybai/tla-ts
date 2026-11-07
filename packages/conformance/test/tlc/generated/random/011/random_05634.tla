(*---
description: Evaluates a random bool expression, seed 262, number 5634.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05634 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + CASE TRUE -> 0 [] OTHER -> 1]).a \in ({b8707 \in {2, 0} : ({x \in 1..3 : x > 1} = 2..1)} \ {CASE FALSE -> 2 [] OTHER -> 2147483647 : b8708 \in (3 .. -1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
