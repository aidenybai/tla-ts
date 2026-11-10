(*---
description: Evaluates a random int expression, seed 262, number 3122.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03122 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((CHOOSE r \in [a : {1}] : TRUE) < CASE (2147483647 \in SUBSET {1}) -> LET b4990 == TRUE IN b4990 [] OTHER -> (2147483647 * 3)) -> ((CHOOSE b4991 \in {1, 0} : ([a |-> 1] = TRUE)) + ((-3) - Len(<<1, 2>>))) [] OTHER -> (([[x \in 1..2 |-> x] EXCEPT ![3] = 2147483647] @@ (CHOOSE f \in [{} -> 2..1] : TRUE)))[(-(-1 \div 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03122 failed.
    Attempted to check if the non-enumerable value
    2147483647
    is element of
    {{}, {1}}
---*)
