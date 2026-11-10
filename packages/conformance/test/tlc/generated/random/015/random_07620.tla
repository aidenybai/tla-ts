(*---
description: Evaluates a random bool expression, seed 262, number 7620.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07620 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b11721 \in UNION {{2147483647, -1}, ({x \in 1..3 : x > 1} \cap 1..3)} : (\A b11722 \in DOMAIN (1 :> 2) : ([a |-> 1] = [a |-> 1]))) < CASE ((2 \in SUBSET {1}) /\ (<<1>> = (1 :> 2))) -> (([x \in 1..2 |-> x])[7] \div (7 % 3)) [] OTHER -> (CHOOSE b11723 \in {-1, SUBSET {1}} : ({x \in 1..3 : x > 1} = {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07620 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
