(*---
description: Evaluates a random bool expression, seed 262, number 9996.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09996 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 :> 2) @@ (CHOOSE f \in [{1} -> 1..2] : TRUE)) + ((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE))[IF FALSE THEN 0 ELSE 3]) \in UNION {(CASE TRUE -> 7 [] OTHER -> -1 .. (SUBSET {1} \cap Nat)), ((CHOOSE b15541 \in 1..3 : TRUE) .. (-1 + 2147483647))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09996 failed.
    Attempted to apply function:
    (2 :> 1)
    to argument 3, which is not in the domain of the function.
---*)
