(*---
description: Evaluates a random record expression, seed 262, number 9366.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09366 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (CHOOSE b14538 \in ([a |-> 1] \cap {1}) : (TRUE \/ FALSE)), b |-> (\E b14539 \in ({1, 2} \cap {1}) : CASE TRUE -> [x \in 1..2 |-> x] [] OTHER -> b14539)] \/ (Len(Append(<<3, 1, 2>>, -1)) \in (DOMAIN [a |-> 1] \cap (-1 .. 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09366 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
---*)
