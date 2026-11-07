(*---
description: Evaluates a random seq expression, seed 262, number 9636.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09636 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(SubSeq(Tail(<<3, 1, 2>>), Cardinality({x \in 1..3 : x > 1}), Head(<<1>>)), LET b14959 == ([a |-> 1]).a IN Head(0), Cardinality(DOMAIN 2147483647)) EXCEPT ![1] = ([b14960 \in DOMAIN [x \in 1..2 |-> x] |-> ([a |-> 1]).a] @@ ((2147483647 + -1) :> LET b14961 == 2147483647 IN 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    0
    2283:0 The argument of Head should be a sequence, but instead it is:
    0
---*)
