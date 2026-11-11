(*---
description: Evaluates a random set expression, seed 262, number 7632.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07632 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (Append(<<1>>, -1) = [[a |-> 1, b |-> TRUE] EXCEPT ![b11737] = b11737]) -> [[<<1>> EXCEPT !.a = @ + 7] EXCEPT !.a = @ + Cardinality(2..1)] [] OTHER -> (Len(<<3, 1, 2>>) * (1 \div b11737)) : b11737 \in (({-1, [x \in 1..2 |-> x]} \ ({2, 1, 3} \cap {x \in 1..3 : x > 1})) \cap ((3 + 1) .. (CHOOSE b11738 \in Nat : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07632 failed.
    Attempted to check equality of integer 2 with non-integer:
    <<1, 2>>
---*)
