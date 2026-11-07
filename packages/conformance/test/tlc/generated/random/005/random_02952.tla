(*---
description: Evaluates a random record expression, seed 262, number 2952.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02952 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + ([(<<5, 6>> @@ <<5, 6>>) EXCEPT ![(2147483647 + 7)] = Cardinality(2..1)])[Len(Tail(<<3, 1, 2>>))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+7
    2178:0 Overflow when computing 2147483647+7
---*)
