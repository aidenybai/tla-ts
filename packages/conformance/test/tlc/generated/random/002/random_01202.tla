(*---
description: Evaluates a random bool expression, seed 262, number 1202.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01202 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (-(2147483647 % -1)), b |-> (DOMAIN (1 :> 2) = UNION {Nat, {1}})] /\ (SubSeq((<<3, 1, 2>> \o <<3, 1, 2>>), (CHOOSE b1931 \in Nat : TRUE), (\E b1932 \in {2, 1, 3} : TRUE)) = (((1 :> 2) @@ <<5, 6>>) @@ (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
