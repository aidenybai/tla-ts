(*---
description: Evaluates a random int expression, seed 262, number 1674.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01674 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2669 == ((CASE TRUE -> 2 [] OTHER -> 1 - IF TRUE THEN 2 ELSE 2) % (([x \in Nat |-> x + 1])[2] % (-1 * 7))) IN (Head([<<1, 2>> EXCEPT ![1] = -1]) * (Head(<<1>>) :> (CHOOSE b2670 \in SUBSET {1} : 2..1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 185 to line 14, col 218 of module random_01674
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 185 to line 14, col 218 of module random_01674
---*)
