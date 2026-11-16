(*---
description: Evaluates a random seq expression, seed 262, number 9671.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09671 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Cardinality(UNION {{x \in 1..3 : x > 1}, 2..1}) - LET b15009 == (1 * 3) IN CASE TRUE -> b15009 [] OTHER -> 1), (((CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE) @@ (3 :> 3)))[Len(Append(<<3, 1, 2>>, 3))]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09671 failed.
    Attempted to apply function:
    (3 :> 3)
    to argument 4, which is not in the domain of the function.
---*)
