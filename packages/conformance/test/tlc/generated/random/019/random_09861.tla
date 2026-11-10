(*---
description: Evaluates a random bool expression, seed 262, number 9861.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09861 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b15313 \in ({((1 :> 2))[3], (7 - 2147483647)} \cap UNION {({2, 1, 3} \cup Nat), {[x \in 1..2 |-> x], 0}}) |-> CASE (\E b15314 \in (7 .. -1) : (b15314 < b15313)) -> ([<<5, 6>> EXCEPT ![3] = -1])[(CHOOSE b15315 \in SUBSET {1} : TRUE)] [] OTHER -> Len(<<b15313, b15313>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09861 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
