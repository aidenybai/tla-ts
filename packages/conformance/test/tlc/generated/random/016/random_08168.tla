(*---
description: Evaluates a random function expression, seed 262, number 8168.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08168 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = (Head(<<1, 2>>) \div (-1 * 3))] EXCEPT !.a = [Append(SelectSeq([a |-> 1], LAMBDA e : e > 0), [[a |-> 1] EXCEPT !.a = 2]) EXCEPT ![1] = ((CHOOSE f \in [{1} -> {}] : TRUE))[([a |-> 1]).a]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1]
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1]
---*)
