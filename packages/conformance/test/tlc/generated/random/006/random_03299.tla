(*---
description: Evaluates a random seq expression, seed 262, number 3299.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03299 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Len((<<1, 2>> \o <<1>>)) \div ((TRUE <=> TRUE) /\ (0 \/ FALSE))), (CHOOSE b5245 \in ({b5246 \in 2..1 : FALSE} \cap DOMAIN <<5, 6>>) : (\E b5247 \in DOMAIN (1 :> 2) : ([a |-> 1] = [a |-> 1, b |-> TRUE])))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03299 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    an integer.
    line 14, col 70 to line 14, col 79 of module random_03299
---*)
