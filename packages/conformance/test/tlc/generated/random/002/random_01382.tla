(*---
description: Evaluates a random seq expression, seed 262, number 1382.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01382 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((SortSeq([<<3, 1, 2>> EXCEPT ![1] = 2], LAMBDA p, q : p < q) \o SubSeq(<<3, 1>>, Append([a |-> 1], 0), (0 \div 2147483647))), ([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + (CHOOSE b2206 \in {} : TRUE)]).a))
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
