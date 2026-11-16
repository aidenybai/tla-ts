(*---
description: Evaluates a random function expression, seed 262, number 9264.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09264 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE b14378 \in UNION {{1, 2}, {}} : ({} \subseteq {1})) :> Head(Append(<<1, 2>>, 2147483647))) EXCEPT ![(CHOOSE b14379 \in UNION {{1, 7}, ({1} \ 2..1)} : (DOMAIN (1 :> 2) \subseteq CASE TRUE -> b14379 [] OTHER -> 7))] = ((Cardinality(2..1) + (2 % 0)) * Len(<<2147483647, 3>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09264 failed.
    Attempted to check if the value:
    1
    is an element of the integer 1
---*)
