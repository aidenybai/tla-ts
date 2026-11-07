(*---
description: Evaluates a random function expression, seed 262, number 4798.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04798 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b7488 \in DOMAIN [b7489 \in Nat |-> -1] |-> (((1 :> 2) @@ [x \in Nat |-> x + 1]))[CASE FALSE -> b7488 [] OTHER -> b7488]] EXCEPT ![Cardinality({Cardinality({2, 1, 3}) : b7490 \in (2147483647 .. 2147483647)})] = IF Tail((<<1, 2>> \o <<1, 2>>)) THEN ((7 \div -1) - [<<3, 1, 2>> EXCEPT ![1] = 2147483647]) ELSE (([x \in 1..2 |-> x] * 0) - Cardinality(1..3))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 270 to line 14, col 273 of module random_04798 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 268.
    | Expression starting at line 14, column 268.
    | ExtendableExpr starting at line 14, column 267.
    | Expression starting at line 14, column 267.
    | ExtendableExpr starting at line 14, column 266.
    | Fatal errors while parsing TLA+ spec in file random_04798
    | In module random_04798
    | Could not parse module random_04798 from file random_04798.tla
    | *** Errors: 1
    | In module random_04798
    | Could not parse module random_04798 from file random_04798.tla
    3002:1 Parsing or semantic analysis failed.
---*)
