(*---
description: Evaluates a random seq expression, seed 262, number 8769.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08769 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), (3 \div 3), (CHOOSE b13577 \in {x \in 1..3 : x > 1} : TRUE)), ((CHOOSE r \in [a : 1..2] : TRUE)).a), (CHOOSE b13578 \in (IF TRUE THEN 2147483647 ELSE 7 .. [[a |-> 1] EXCEPT !.a = 1]) : ((<<5, 6>>)[b13578] = CASE FALSE -> 7 [] OTHER -> 0)), Len(<<(7 * 0), (-1 - FALSE)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08769 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
---*)
