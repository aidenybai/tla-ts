(*---
description: Evaluates a random function expression, seed 262, number 3043.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03043 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((((1 :> 2))[1] :> Head(<<>>)) @@ [b4840 \in {b4841 : b4841 \in 2..1} |-> ([a |-> 1]).a]) EXCEPT ![(LET b4842 == Len(<<1, 2>>) IN (CHOOSE b4843 \in 1..3 : TRUE) * ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a)] = IF (([a |-> 1, b |-> TRUE] = <<5, 6>>) <=> SortSeq(<<1>>, LAMBDA p, q : p < q)) THEN (CHOOSE b4844 \in (1..3 \cap {2, 1, 3}) : ({1, 2} \subseteq {1})) ELSE ((7 \in {1, 2}) * ([a |-> 1, b |-> TRUE]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03043 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
