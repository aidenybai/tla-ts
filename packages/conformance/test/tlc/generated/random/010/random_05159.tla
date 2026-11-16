(*---
description: Evaluates a random seq expression, seed 262, number 5159.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05159 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(Tail(({1, 2} = SUBSET {1})), (CASE TRUE -> 0 [] OTHER -> 0 % Head(<<>>))), [[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (2147483647 % 3)] EXCEPT !.a = Cardinality({0 : b8008 \in SUBSET {1}})], ([((1 :> 2) @@ <<5, 6>>) EXCEPT ![(CHOOSE b8009 \in TRUE : FALSE)] = IF FALSE THEN -1 ELSE <<>>])[Cardinality((2..1 \ {1, 2}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05159 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
