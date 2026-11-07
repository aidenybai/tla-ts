(*---
description: Evaluates a random function expression, seed 262, number 251.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00251 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE) @@ (2147483647 :> 3)) EXCEPT ![(Cardinality(SUBSET {1}) + LET b417 == 2 IN 2147483647)] = (CHOOSE b418 \in {0 : b419 \in {1}} : (FALSE \/ FALSE))] @@ (CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2+2147483647
    2178:0 Overflow when computing 2+2147483647
---*)
