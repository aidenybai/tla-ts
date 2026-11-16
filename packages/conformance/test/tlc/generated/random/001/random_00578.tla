(*---
description: Evaluates a random int expression, seed 262, number 578.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00578 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((CHOOSE b976 \in {x \in 1..3 : x > 1} : 0) = (CHOOSE b977 \in {1} : TRUE)) \/ ((3 \div 1) = (0 + 2147483647))) -> (IF ({} = 2..1) THEN [<<5, 6>> EXCEPT ![0] = 7] ELSE ([a |-> 1, b |-> TRUE]).a % ((2 * 2147483647) + ([a |-> 1]).a)) [] OTHER -> (((7 - Nat) :> IF TRUE THEN 2 ELSE 7))[(Tail(<<3, 1, 2>>) \div (1 \div 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00578 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 24 to line 14, col 63 of module random_00578
---*)
