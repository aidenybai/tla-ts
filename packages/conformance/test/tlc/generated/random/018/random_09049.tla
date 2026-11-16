(*---
description: Evaluates a random set expression, seed 262, number 9049.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09049 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(SubSeq(<<2147483647, <<>>>>, IF TRUE THEN 0 ELSE -1, ((1 :> 2))[2]) \cap {b14054 \in {{2, 1, 3} : b14055 \in Nat} : (~FALSE)}), {b14056 \in {(CHOOSE b14057 \in {} : TRUE), CASE FALSE -> 0 [] OTHER -> 7} : ({{} : b14058 \in {1}} = {b14059 \in 2..1 : FALSE})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09049 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
