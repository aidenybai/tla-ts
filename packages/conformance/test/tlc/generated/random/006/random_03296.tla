(*---
description: Evaluates a random record expression, seed 262, number 3296.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03296 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + ([b5238 \in ({} \cup {x \in 1..3 : x > 1}) |-> (b5238 \div b5238)])[LET b5239 == Cardinality({1}) IN (-b5239)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03296 failed.
    In applying the function
    (2 :> 1 @@ 3 :> 1),
    the first argument is:
    -1
    which is not in its domain.
---*)
