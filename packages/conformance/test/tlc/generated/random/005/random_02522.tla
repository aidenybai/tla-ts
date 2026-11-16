(*---
description: Evaluates a random set expression, seed 262, number 2522.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02522 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b3976 \in DOMAIN [(1 :> 2) EXCEPT ![0] = 7] : ((b3976 - b3976) = LET b3977 == 1 IN 2)} \cap {(CHOOSE b3978 \in {2, -1} : ([a |-> 1] = [a |-> 1])), (((1 :> 2) @@ <<5, 6>>))[Cardinality(2..1)]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 37 to line 14, col 42 of module random_02522
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02522 failed.
    Attempted to apply function:
    <<2, 6>>
    to argument 0, which is not in the domain of the function.
---*)
