(*---
description: Evaluates a random int expression, seed 262, number 1236.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01236 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (~(~(2147483647 \in {1, 2}))) -> (CHOOSE b1981 \in ([b1982 \in {x \in 1..3 : x > 1} |-> b1982] @@ (0 :> 3)) : (UNION {{x \in 1..3 : x > 1}, 1..3} \subseteq ({x \in 1..3 : x > 1} \cap SUBSET {1}))) [] OTHER -> (Len([<<3, 1, 2>> EXCEPT ![1] = 1]) \div Len(SubSeq({}, 7, 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {}
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {}
---*)
