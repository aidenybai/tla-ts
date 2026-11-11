(*---
description: Evaluates a random function expression, seed 262, number 2751.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02751 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((-CASE TRUE -> 1 [] OTHER -> 0) :> (Cardinality({}) * (CHOOSE b4342 \in SUBSET {1} : FALSE))) EXCEPT ![([((1 :> 2) @@ [x \in Nat |-> x + 1]) EXCEPT ![(CHOOSE f \in [{1} -> {1, 2} \cap {2}] : TRUE)] = ([a |-> 1, b |-> TRUE]).a])[Head(SubSeq(<<1, 2>>, 0, 3))]] = LET b4343 == Cardinality({b4344 \in 2..1 : TRUE}) IN CASE (SUBSET {1} = Nat) -> (b4343)[b4343] [] OTHER -> ((1 :> 2))[2147483647]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02751 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 73 to line 14, col 107 of module random_02751
---*)
