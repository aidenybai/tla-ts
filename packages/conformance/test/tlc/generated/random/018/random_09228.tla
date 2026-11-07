(*---
description: Evaluates a random seq expression, seed 262, number 9228.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09228 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Tail(Append(SUBSET {1}, 1))) \o SelectSeq(((<<1, 2>> \o 2147483647) \o (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {{}, {1}}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {{}, {1}}
---*)
