(*---
description: Evaluates a random record expression, seed 262, number 9571.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09571 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 0, b |-> FALSE] EXCEPT !.a = SubSeq(<<3, 1, 2>>, 0, 1)] EXCEPT !.a = @ + (CHOOSE b14858 \in Tail(<<>>) : (0 < b14858))] EXCEPT !.a = @ + (CHOOSE b14859 \in UNION {(1..3 \cap Nat), {3, -1}} : (\A b14860 \in (2..1 \ 2..1) : (TRUE \/ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09571 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
---*)
