(*---
description: Evaluates a random set expression, seed 262, number 4294.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04294 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b6765 \in ({(CHOOSE b6767 \in {x \in 1..3 : x > 1} : FALSE) : b6766 \in ({1, 2} \ FALSE)} \ (({1, 2} \cup {1}) \ {b6768 : b6768 \in {1, 2}})) : ({Len(<<>>) : b6769 \in {b6770 : b6770 \in {x \in 1..3 : x > 1}}} \subseteq UNION {{b6765 : b6771 \in Nat}, (b6765 .. 7)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04294 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
