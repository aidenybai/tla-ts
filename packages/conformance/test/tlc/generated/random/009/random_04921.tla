(*---
description: Evaluates a random seq expression, seed 262, number 4921.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04921 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(Append(Tail(<<3, 1, 2>>), IF TRUE THEN -1 ELSE 1), (-CASE FALSE -> 2147483647 [] OTHER -> 7), LET b7654 == CASE TRUE -> 0 [] OTHER -> 0 IN (-b7654)) EXCEPT ![1] = ([b7655 \in UNION {Nat, {x \in 1..3 : x > 1}} |-> (1 \div b7655)])[(CHOOSE b7656 \in {7, 1} : (<<3, 1, 2>> = [x \in Nat |-> x + 1]))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2, -1>>
    , but instead it is
    -7
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2, -1>>
    , but instead it is
    -7
---*)
