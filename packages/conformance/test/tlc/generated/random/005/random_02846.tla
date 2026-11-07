(*---
description: Evaluates a random function expression, seed 262, number 2846.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02846 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((-(CHOOSE b4514 \in SUBSET {1} : <<3, 1, 2>>)) :> [b4515 \in (SUBSET {1} \cup 1..3) |-> (<<5, 6>>)[b4515]]) EXCEPT ![(CHOOSE r \in [a : {1, 2}] : TRUE)] = ((Len(<<1>>) \div (7 - -1)) - (CHOOSE b4516 \in {1, 0} : (<<>> = [x \in Nat |-> x + 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 21 to line 14, col 61 of module random_02846
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 21 to line 14, col 61 of module random_02846
---*)
