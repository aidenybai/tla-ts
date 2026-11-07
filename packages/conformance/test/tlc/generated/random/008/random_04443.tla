(*---
description: Evaluates a random set expression, seed 262, number 4443.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04443 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b6991 \in DOMAIN (<<5, 6>> @@ <<1>>) : SortSeq([<<>> EXCEPT ![1] = -1], LAMBDA p, q : p < q)) : b6990 \in (DOMAIN (<<5, 6>> @@ 2) \ ((3 .. 7) \cap (3 .. 2147483647)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    2
    2169:0 The second argument of @@ should be a function, but instead it is:
    2
---*)
