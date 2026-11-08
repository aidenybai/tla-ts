(*---
description: Evaluates a random bool expression, seed 262, number 8072.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08072 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<CASE (<<3, 1, 2>> = <<5, 6>>) -> (7 * 2) [] OTHER -> [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + <<1>>], CASE (\E b12474 \in {} : FALSE) -> (1 \div 1) [] OTHER -> (CHOOSE b12475 \in 2..1 : TRUE)>> \o Append(SubSeq(Append(<<1>>, 1), (0 + 2), (3 % 1)), ((3 \div 0) \div CASE TRUE -> 0 [] OTHER -> 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08072 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
