(*---
description: Evaluates a random seq expression, seed 262, number 9521.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09521 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = Len((1 :> 2))], LAMBDA e : e > 0) EXCEPT ![1] = LET b14789 == ((CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE))[(-1 - 2)] IN Cardinality(DOMAIN (1 :> 2))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
