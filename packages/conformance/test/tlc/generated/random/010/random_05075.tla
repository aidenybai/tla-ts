(*---
description: Evaluates a random seq expression, seed 262, number 5075.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05075 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0), ([b7897 \in 1..3 |-> b7897] @@ [b7898 \in {} |-> 1..3])) EXCEPT ![1] = ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 1, 2, <<1, 2, 3>>>>"
---*)
