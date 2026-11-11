(*---
description: Evaluates a random int expression, seed 262, number 3402.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03402 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b5401 \in {(7 :> 2147483647), (3 - 0)} |-> Cardinality(({1} \ {}))] EXCEPT ![(CHOOSE b5402 \in {Head(<<3, 1, 2>>) : b5403 \in ({1} \cap {2, 1, 3})} : ({b5402, b5402} = UNION {{2, 1, 3}, SUBSET {1}}))] = CASE UNION {({2, 1, 3} \cap SUBSET {1}), UNION {2..1, 2..1}} -> ((CHOOSE b5404 \in SUBSET {1} : <<1, 2>>) - CASE FALSE -> 2 [] OTHER -> 0) [] OTHER -> (CHOOSE b5405 \in (2..1 \cap Nat) : ((1 :> 2) @@ (1 :> 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03402 failed.
    Attempted to compare integer 3 with non-integer:
    (7 :> 2147483647)
---*)
