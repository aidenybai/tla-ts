(*---
description: Evaluates a random seq expression, seed 262, number 2030.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02030 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<>> \o <<3, 1, 2>>) = (2 :> 2)) <=> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] = [[a |-> 1] EXCEPT !.a = @ + 2147483647])) => (((1..3 \subseteq {1, 2}) <=> (\E b3222 \in {x \in 1..3 : x > 1} : TRUE)) => ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] = [[a |-> 1] EXCEPT !.a = @ + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
