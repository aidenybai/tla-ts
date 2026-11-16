(*---
description: Evaluates a random function expression, seed 262, number 6190.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06190 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9528 \in {([b9529 \in {1, 2} |-> b9529])[(-1 - 2147483647)], (CHOOSE b9530 \in (3 .. 7) : (<<1>> = [x \in Nat |-> x + 1]))} |-> (Cardinality(({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1})) * (Append(<<1>>, -1) % Head(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06190 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -2147483648
    which is not in its domain.
---*)
