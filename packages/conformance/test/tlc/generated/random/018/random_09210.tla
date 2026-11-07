(*---
description: Evaluates a random set expression, seed 262, number 9210.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09210 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head((SelectSeq(<<>>, LAMBDA e : e > 0) \o SubSeq(<<1>>, b14296, b14296))) : b14296 \in DOMAIN [(3 :> 2) EXCEPT ![IF TRUE THEN -1 ELSE {1}] = (-1 % 2147483647)]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 114 to line 14, col 119 of module random_09210
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    3
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    3
---*)
