(*---
description: Evaluates a random function expression, seed 262, number 2140.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02140 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b3384 \in {b3385 \in UNION {{1}, SUBSET {1}} : (\E b3386 \in {1, 2} : TRUE)} |-> Len(Append(<<1>>, b3384))] @@ ((CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \cap {2}] : TRUE) @@ (CASE TRUE -> 2147483647 [] OTHER -> 2 :> (<<5, 6>>)[1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    2147483647
    2169:0 The second argument of @@ should be a function, but instead it is:
    2147483647
---*)
