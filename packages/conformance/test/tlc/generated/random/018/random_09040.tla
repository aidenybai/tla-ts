(*---
description: Evaluates a random int expression, seed 262, number 9040.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09040 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b14039 \in (DOMAIN (1 :> 2) \cap {-1 : b14040 \in SUBSET {1}}) : (\A b14041 \in (3 .. b14039) : (0 \in {1}))) % (((\E b14042 \in SUBSET {1} : TRUE)).a % LET b14043 == (0 \div TRUE) IN ([x \in 1..2 |-> x])[<<1>>])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09040 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 132 of module random_09040
---*)
