(*---
description: Evaluates a random int expression, seed 262, number 2607.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02607 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b4105 \in DOMAIN (Len(<<3, 1, 2>>) :> ([a |-> 1]).a) : ((\E b4106 \in [b4107 \in {} |-> b4107] : (b4106 < 2)) <=> (CASE FALSE -> <<3, 1, 2>> [] OTHER -> b4105 = ({1, 2} \cap Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02607 failed.
    TLC encountered a non-enumerable quantifier bound
    <<>>.
    line 14, col 94 to line 14, col 117 of module random_02607
---*)
