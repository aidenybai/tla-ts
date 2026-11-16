(*---
description: Evaluates a random function expression, seed 262, number 6837.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06837 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a :> Len(SubSeq({2, 1, 3}, 7, 2147483647))) EXCEPT ![((CHOOSE b10474 \in {b10475 : b10475 \in {x \in 1..3 : x > 1}} : (<<>> = [x \in Nat |-> x + 1])) * (((1 :> 2) @@ <<5, 6>>) \div (-1 + 7)))] = LET b10476 == Cardinality({b10477 \in Nat : FALSE}) IN ((CHOOSE b10478 \in {1} : FALSE) \div (b10476 \div -1))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 356 to line 14, col 359 of module random_06837 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 349.
    | Expression starting at line 14, column 349.
    | ExtendableExpr starting at line 14, column 348.
    | ExtendableExpr starting at line 14, column 311.
    | Expression starting at line 14, column 311.
    | Fatal errors while parsing TLA+ spec in file random_06837
    | In module random_06837
    | Could not parse module random_06837 from file random_06837.tla
    | *** Errors: 1
    | In module random_06837
    | Could not parse module random_06837 from file random_06837.tla
    3002:1 Parsing or semantic analysis failed.
---*)
