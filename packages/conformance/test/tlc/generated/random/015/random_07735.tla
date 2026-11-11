(*---
description: Evaluates a random set expression, seed 262, number 7735.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07735 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b11929 \in {b11930 \in {3 : b11931 \in {1}} : (\A b11932 \in {} : FALSE)} : (Cardinality({}) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b11928])) : b11928 \in ((((1 :> 2))[7] \div CASE FALSE -> 0 [] OTHER -> 7) .. (SubSeq(<<>>, 3, 2147483647) + CASE FALSE -> 7 [] OTHER -> 0))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07735 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
