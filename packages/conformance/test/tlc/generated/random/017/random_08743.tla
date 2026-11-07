(*---
description: Evaluates a random seq expression, seed 262, number 8743.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08743 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq((SelectSeq(<<>>, LAMBDA e : e > 0) \o <<SUBSET {1}, 1>>), LAMBDA p, q : p < q), (((1 % 7) % Cardinality(1..3)) % ([[x \in 1..2 |-> x] EXCEPT ![0] = 2147483647])[IF FALSE THEN 2 ELSE 2147483647])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    {{}, {1}}
    2266:0 The second argument of < should be an integer, but instead it is:
    {{}, {1}}
---*)
