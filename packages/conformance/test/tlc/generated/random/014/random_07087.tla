(*---
description: Evaluates a random set expression, seed 262, number 7087.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07087 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10883 \in DOMAIN ((CHOOSE f \in [{1, 2} -> 2..1] : TRUE) @@ (2 :> 2)) : (\A b10884 \in (({x \in 1..3 : x > 1} \cap {2, 1, 3}) \cap ({2, 1, 3} \ Nat)) : (({1} = Nat) \/ (~TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07087 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 37 to line 14, col 72 of module random_07087
---*)
