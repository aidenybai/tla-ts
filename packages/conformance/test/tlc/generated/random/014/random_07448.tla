(*---
description: Evaluates a random seq expression, seed 262, number 7448.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07448 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SortSeq(Tail(<<>>), LAMBDA p, q : p < q), ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE))[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)]) EXCEPT ![1] = (CHOOSE b11482 \in {Head(<<3, 1, 2>>) : b11483 \in DOMAIN (1 :> 2)} : (Cardinality(b11482) = Head(<<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07448 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
