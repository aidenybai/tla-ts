(*---
description: Evaluates a random set expression, seed 262, number 5181.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05181 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b8039 \in ({Head(<<>>) : b8040 \in {0, -1}} \ (DOMAIN (1 :> 2) \ {7 : b8041 \in {}})) : ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (b8039 * b8039)] = [a |-> (7 % b8039), b |-> (FALSE /\ TRUE)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
