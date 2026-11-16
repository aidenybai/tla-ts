(*---
description: Evaluates a random set expression, seed 262, number 7291.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07291 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((0 :> 2147483647))[IF FALSE THEN 2147483647 ELSE 2147483647], (([x \in 1..2 |-> x])[2147483647] % (<<>> - 2))} \ {b11231 \in ((SUBSET {1} \cup 1..3) \ (TRUE \cap Nat)) : (CHOOSE b11232 \in (2..1 \cup {1}) : (0 < b11232))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07291 failed.
    Attempted to apply function:
    (0 :> 2147483647)
    to argument 2147483647, which is not in the domain of the function.
---*)
