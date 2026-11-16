(*---
description: Evaluates a random record expression, seed 262, number 255.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00255 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b428 \in {Cardinality({x \in 1..3 : x > 1}) : b429 \in [<<1, 2>> EXCEPT ![1] = 3]} |-> ((-1 + b428) - (CHOOSE b430 \in {} : FALSE))] EXCEPT !.a = @ + (Cardinality({b431 \in <<5, 6>> : TRUE}) % ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE))[LET b432 == 0 IN b432])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00255 failed.
    TLC encountered a non-enumerable quantifier bound
    <<3, 2>>.
    line 14, col 73 to line 14, col 98 of module random_00255
---*)
