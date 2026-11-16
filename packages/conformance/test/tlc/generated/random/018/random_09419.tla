(*---
description: Evaluates a random set expression, seed 262, number 9419.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09419 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(((1 :> 2))[3] \div (<<5, 6>>)[b14608]) : b14608 \in ({2, 3} \cup (7 .. 0))} \ {(CHOOSE b14610 \in {b14611 \in 2..1 : TRUE} : (TRUE /\ FALSE)) : b14609 \in DOMAIN (2147483647 :> 2147483647)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09419 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
