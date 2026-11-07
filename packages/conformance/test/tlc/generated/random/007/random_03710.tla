(*---
description: Evaluates a random record expression, seed 262, number 3710.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03710 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len([Append([a |-> 1], 7) EXCEPT ![1] = CASE TRUE -> [a |-> 1] [] OTHER -> 7]), b |-> ((CHOOSE r \in [a : 1..2] : TRUE) = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = @ + CASE TRUE -> 0 [] OTHER -> 2147483647])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1]
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1]
---*)
