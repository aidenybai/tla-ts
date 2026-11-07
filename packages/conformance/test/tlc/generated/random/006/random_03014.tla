(*---
description: Evaluates a random record expression, seed 262, number 3014.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03014 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE (\A b4788 \in {7, 0} : (<<>> = (1 :> 2))) -> ([a |-> -1, b |-> [a |-> 1]]).a [] OTHER -> ({1 : b4789 \in 2..1} \cap {-1, 7}), b |-> ([a |-> ([x \in Nat |-> x + 1])[2147483647], b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + (CHOOSE r \in [a : 2..1] : TRUE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
