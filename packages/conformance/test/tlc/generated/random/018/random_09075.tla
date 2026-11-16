(*---
description: Evaluates a random int expression, seed 262, number 9075.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09075 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(<<5, 6>> @@ (1 :> 2)) EXCEPT ![(7 * 1)] = (3 % 2)])[([<<5, 6>> EXCEPT ![3] = 2147483647])[(1 * 2147483647)]] + (Cardinality(({} \ 2..1)) * CASE (Nat \subseteq {x \in 1..3 : x > 1}) -> Len(<<>>) [] OTHER -> (CHOOSE b14099 \in 1..3 : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 39 of module random_09075
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 74 to line 14, col 81 of module random_09075
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09075 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
