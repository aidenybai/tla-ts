(*---
description: Evaluates a random seq expression, seed 262, number 9171.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09171 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (~((SUBSET {1} \ 2..1) = (SUBSET {1} \cap 1..3))) -> (((CHOOSE b14239 \in 2..1 : FALSE))[(2 \div 2)] * (-CASE TRUE -> 1 [] OTHER -> 0)) [] OTHER -> ((CHOOSE r \in [a : {}] : TRUE)).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09171 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
