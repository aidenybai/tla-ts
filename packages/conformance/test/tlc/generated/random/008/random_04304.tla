(*---
description: Evaluates a random function expression, seed 262, number 4304.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04304 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE) @@ (((1 :> 2)).a :> Tail(<<1>>))) @@ [([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] :> LET b6783 == 0 IN [a |-> 1]) EXCEPT ![LET b6784 == (-0) IN Cardinality({1, 2})] = ([b6785 \in SUBSET {1} |-> b6785])[(-1 % 1)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04304 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
