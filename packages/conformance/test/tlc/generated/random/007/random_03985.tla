(*---
description: Evaluates a random set expression, seed 262, number 3985.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03985 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {DOMAIN [b6273 \in Nat |-> b6273], (([a |-> 1] = [a |-> 1]) \cap UNION {1..3, Nat})} \ {b6274 \in ((3 \ {1, 2}) \ ({x \in 1..3 : x > 1} \cap SUBSET {1})) : ((<<3, 1, 2>> \o <<1>>) = (b6274 :> b6274))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03985 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
