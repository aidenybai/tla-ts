(*---
description: Evaluates a random seq expression, seed 262, number 4149.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04149 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SortSeq([<<1, 2>> EXCEPT ![1] = 2], LAMBDA p, q : p < q) \o SubSeq(<<2, (1 :> 2)>>, IF TRUE THEN 7 ELSE -1, (2147483647 + 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2
    2178:0 Overflow when computing 2147483647+2
---*)
