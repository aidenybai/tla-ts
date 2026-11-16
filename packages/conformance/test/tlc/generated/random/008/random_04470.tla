(*---
description: Evaluates a random int expression, seed 262, number 4470.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04470 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (\E b7033 \in {b7034 \in DOMAIN (1 :> 2) : (TRUE /\ 2..1)} : (({x \in 1..3 : x > 1} = 2..1) => ([a |-> 1, b |-> TRUE] = [a |-> 1]))) -> (((<<5, 6>> @@ (1 :> 2)) @@ [b7035 \in {1} |-> b7035]))[((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a] [] OTHER -> ([{-1, <<3, 1, 2>>} EXCEPT ![([x \in 1..2 |-> x])[2147483647]] = (TRUE + 2147483647)])[Head(<<SUBSET {1}, <<3, 1, 2>>>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04470 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a set of the form i..j.
    line 14, col 65 to line 14, col 76 of module random_04470
---*)
