(*---
description: Evaluates a random set expression, seed 262, number 8282.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08282 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12824 \in {Len(SubSeq(<<3, 1, 2>>, b12825, 2147483647)) : b12825 \in UNION {({} \cap SUBSET {1}), (0 .. 0)}} : ((Head(<<1>>) % (2147483647 \div b12824)) = ([[a |-> 1] EXCEPT !.a = @ + b12824]).a)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08282 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
---*)
