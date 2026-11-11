(*---
description: Evaluates a random set expression, seed 262, number 1463.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01463 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([((1 :> 2) @@ [x \in 1..2 |-> x]) EXCEPT ![(b2337 + b2337)] = ([x \in Nat |-> x + 1] \cup {x \in 1..3 : x > 1})])[CASE (SUBSET {1} \subseteq {x \in 1..3 : x > 1}) -> ((1 :> 2))[3] [] OTHER -> (<<5, 6>>)[b2337]] : b2337 \in (Head(Append(<<1>>, 3)) .. ([[a |-> 1] EXCEPT ![2147483647] = 1] @@ (CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01463 failed.
    Attempted to access record by a non-string argument: 2147483647
---*)
