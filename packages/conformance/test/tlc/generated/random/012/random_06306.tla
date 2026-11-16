(*---
description: Evaluates a random seq expression, seed 262, number 6306.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06306 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(Tail(Tail(<<1, 2>>))), Cardinality(DOMAIN (TRUE :> 3)), (((2 \div 7) * CASE FALSE -> (1 :> 2) [] OTHER -> -1) + ((7 :> -1))[(CHOOSE b9696 \in {x \in 1..3 : x > 1} : TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06306 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
