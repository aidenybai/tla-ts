(*---
description: Evaluates a random set expression, seed 262, number 6482.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06482 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(({b9968 \in {x \in 1..3 : x > 1} : FALSE} \cap {b9969 \in 2..1 : TRUE}) \cup {b9970 \in ([a |-> 1] \ {1, 2}) : [(1 :> 2) EXCEPT ![7] = 2147483647]}), UNION {{b9971 \in DOMAIN (1 :> 2) : (CHOOSE b9972 \in SUBSET {1} : FALSE)}, {CASE FALSE -> 1 [] OTHER -> 2, Len(<<1, 2>>)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06482 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 211 to line 14, col 245 of module random_06482
---*)
