(*---
description: Evaluates a random record expression, seed 262, number 9002.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09002 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = IF (\E b13982 \in {1 : b13983 \in SUBSET {1}} : (\E b13984 \in {} : FALSE)) THEN Cardinality((SUBSET {1} \cap Nat)) ELSE (-((1 :> 2))[3])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09002 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
