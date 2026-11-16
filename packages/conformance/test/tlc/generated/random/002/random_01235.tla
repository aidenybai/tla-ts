(*---
description: Evaluates a random int expression, seed 262, number 1235.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01235 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([([b1979 \in {1} |-> b1979] @@ (2147483647 :> {x \in 1..3 : x > 1})) EXCEPT ![((3 + 2) :> Len(<<>>))] = ((0 % 2) % CASE FALSE -> 2 [] OTHER -> 2147483647)] % ((CHOOSE b1980 \in (2..1 \cup 1..3) : (<<>> = <<5, 6>>)) % Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01235 failed.
    Attempted to check equality of integer 1 with non-integer:
    (5 :> 0)
---*)
