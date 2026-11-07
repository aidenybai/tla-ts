(*---
description: Evaluates a random seq expression, seed 262, number 8925.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08925 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(([SubSeq(<<1, 2>>, 1, 1) EXCEPT ![1] = (CHOOSE b13840 \in {2, 1, 3} : [a |-> 1])] \o Append(SubSeq(<<1>>, 7, 1), (2147483647 + FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 61 to line 14, col 99 of module random_08925
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 61 to line 14, col 99 of module random_08925
---*)
