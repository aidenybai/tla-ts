(*---
description: Evaluates a random set expression, seed 262, number 1552.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01552 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b2474 \in UNION {{3, 1}, {b2475 \in Nat : FALSE}} : ((\A b2476 \in SUBSET {1} : FALSE) <=> (b2474 < b2474))} \ ((CASE FALSE -> 2 [] OTHER -> 0 .. ((1 :> 2))[2147483647]) \cap ({3 : b2477 \in {2, 1, 3}} \cup CASE FALSE -> -1 [] OTHER -> 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01552 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
