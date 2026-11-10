(*---
description: Evaluates a random record expression, seed 262, number 2908.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02908 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = ([b4602 \in {1} |-> b4602])[<<2147483647, 1>>]] EXCEPT !.a = @ + ((CHOOSE b4603 \in {2147483647, 0} : (<<>> = (1 :> 2))) % LET b4604 == [[a |-> 1] EXCEPT !.a = @ + -1] IN (b4604 * b4604))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02908 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<2147483647, 1>>
---*)
