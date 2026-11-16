(*---
description: Evaluates a random set expression, seed 262, number 1471.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01471 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF ({2, 0} = DOMAIN [x \in 1..2 |-> x]) THEN ((2 % 7) - (CHOOSE b2348 \in {} : TRUE)) ELSE ((<<5, 6>> @@ (1 :> 2)))[(3 * 2)], (IF (FALSE \/ TRUE) THEN Head(<<3, 1, 2>>) ELSE (1 + 2) + ((0 + 1) \div (\E b2349 \in SUBSET {1} : FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01471 failed.
    Attempted to apply function:
    <<5, 6>>
    to argument 6, which is not in the domain of the function.
---*)
