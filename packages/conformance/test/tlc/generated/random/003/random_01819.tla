(*---
description: Evaluates a random set expression, seed 262, number 1819.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01819 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE) @@ [(1 :> 2) EXCEPT ![7] = -1]))[(([a |-> 1]).a * (0 % 1))], (CHOOSE b2883 \in {b2884 \in {-1 : b2885 \in {}} : (\E b2886 \in {x \in 1..3 : x > 1} : FALSE)} : ((b2883 \ SUBSET {1}) \subseteq {b2883 : b2887 \in SUBSET {1}}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 77 to line 14, col 82 of module random_01819
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01819 failed.
    Attempted to apply function:
    <<2, 0>>
    to argument 0, which is not in the domain of the function.
---*)
