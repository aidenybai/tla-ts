(*---
description: diff_left applied to double_at, a FcnRcdValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_left_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) @@ (2 :> 3) \ {1})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    (2 :> 3) \ {1}
    2169:0 The second argument of @@ should be a function, but instead it is:
    (2 :> 3) \ {1}
---*)
