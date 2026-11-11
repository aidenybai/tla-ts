(*---
description: Evaluates a random set expression, seed 262, number 6733.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06733 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({((1 :> 2))[0], (CHOOSE b10317 \in {2, 1, 3} : TRUE)} \cup {(-1), (2147483647 + <<3, 1, 2>>)}) \ {b10318 \in ((SUBSET {1} \cap SUBSET {1}) \ {3 : b10319 \in Nat}) : ((CHOOSE b10320 \in 2..1 : TRUE) = (CHOOSE b10321 \in {2, 1, 3} : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06733 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
