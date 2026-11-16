(*---
description: Evaluates a random bool expression, seed 262, number 4140.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04140 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b6520 \in {(-(-0)), (CHOOSE b6521 \in (2147483647 .. 2) : (<<1>> = [x \in Nat |-> x + 1]))} : (SubSeq(SubSeq(<<3, 1, 2>>, b6520, 7), Head(<<3, 1, 2>>), ([a |-> 1, b |-> TRUE]).a) = ([(1 :> 2) EXCEPT ![b6520] = 2147483647] @@ (3 .. b6520)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04140 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 41 to line 14, col 108 of module random_04140
---*)
