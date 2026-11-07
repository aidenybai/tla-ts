(*---
description: Evaluates a random set expression, seed 262, number 4808.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04808 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality(((3 + 2147483647) .. Len(<<>>))) : b7498 \in DOMAIN (([x \in 1..2 |-> x] @@ SUBSET {1}) @@ [b7499 \in FALSE |-> 0])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {{}, {1}}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {{}, {1}}
---*)
