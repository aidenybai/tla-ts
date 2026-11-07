(*---
description: Evaluates a random set expression, seed 262, number 3942.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03942 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b6204 \in DOMAIN [(1 :> 2) EXCEPT ![7] = 1] : ((\E b6205 \in 2..1 : FALSE) => ({1} = SUBSET {1}))) % (([[a |-> 1] EXCEPT !.a = 2]).a + ((-2) \div (CHOOSE b6206 \in {x \in 1..3 : x > 1} : [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 44 to line 14, col 49 of module random_03942
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 172 to line 14, col 220 of module random_03942
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 172 to line 14, col 220 of module random_03942
---*)
