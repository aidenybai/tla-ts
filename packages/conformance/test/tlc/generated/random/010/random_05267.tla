(*---
description: Evaluates a random set expression, seed 262, number 5267.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05267 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {{Head(<<>>), (CHOOSE b8151 \in [x \in 1..2 |-> x] : TRUE)}, {b8152 \in {2 : b8153 \in Nat} : (\A b8154 \in 2..1 : FALSE)}}, (LET b8155 == ([a |-> 1]).a IN IF {1, 2} THEN b8155 ELSE (1 :> 2) .. (([a |-> 1]).a \div LET b8156 == 0 IN b8156))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05267 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
