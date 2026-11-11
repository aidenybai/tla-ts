(*---
description: Evaluates a random set expression, seed 262, number 5283.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05283 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([a |-> (CASE FALSE -> 1 [] OTHER -> 3 - ([x \in 1..2 |-> x])[0]), b |-> (DOMAIN <<5, 6>> \subseteq UNION {0, Nat})], ((CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \cap {2}] : TRUE))[Cardinality((1..3 \ {1, 2}))], LET b8180 == (-Cardinality({2, 1, 3})) IN CASE (b8180 = b8180) -> LET b8181 == b8180 IN 1 [] OTHER -> ((1 :> 2))[7]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05283 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
