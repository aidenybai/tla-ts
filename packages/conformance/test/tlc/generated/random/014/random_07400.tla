(*---
description: Evaluates a random record expression, seed 262, number 7400.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07400 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + LET b11395 == IF (<<1>> = (1 :> 2)) THEN ((1 :> 2) * 3) ELSE Head(<<1>>) IN (CHOOSE b11396 \in {b11395 : b11397 \in 2147483647} : (<<1>> = [x \in Nat |-> x + 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07400 failed.
    TLC encountered a non-enumerable quantifier bound
    2147483647.
    2147483647
---*)
