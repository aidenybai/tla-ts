(*---
description: Evaluates a random int expression, seed 262, number 9344.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09344 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b14499 \in DOMAIN [b14500 \in {0 : b14501 \in 1..3} |-> ((1 :> 2))[b14500]] : (((1 % b14499) * (b14499 * b14499)) \in (CHOOSE b14502 \in {b14499, b14499} : ([a |-> 1] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09344 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
