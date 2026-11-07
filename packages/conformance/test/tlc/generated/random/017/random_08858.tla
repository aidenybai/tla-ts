(*---
description: Evaluates a random seq expression, seed 262, number 8858.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08858 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(([SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = CASE TRUE -> 7 [] OTHER -> 2147483647] \o Tail(Append(<<1, 2>>, <<>>))), Cardinality((LET b13723 == 3 IN b13723 :> Len(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    (3 :> 2)
    2181:0 Attempted to compute cardinality of the value
    (3 :> 2)
---*)
