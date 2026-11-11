(*---
description: Evaluates a random function expression, seed 262, number 1862.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01862 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([(-1 :> 2147483647) EXCEPT ![(2 \div -1)] = Head(<<3, 1, 2>>)] @@ ((-1)[7] :> (1 % 1))) EXCEPT ![(-((<<5, 6>> @@ [x \in 1..2 |-> x]))[(7 % 2147483647)])] = LET b2938 == ((<<5, 6>>)[2147483647] % (1 + (1 :> 2))) IN <<IF TRUE THEN 0 ELSE b2938, (1 + 7)>>])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 50 to line 14, col 53 of module random_01862 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 48.
    | Expression starting at line 14, column 48.
    | ExtendableExpr starting at line 14, column 47.
    | Expression starting at line 14, column 47.
    | Except Component starting at line 14, column 46.
    | Fatal errors while parsing TLA+ spec in file random_01862
    | In module random_01862
    | Could not parse module random_01862 from file random_01862.tla
    | *** Errors: 1
    | In module random_01862
    | Could not parse module random_01862 from file random_01862.tla
    3002:1 Parsing or semantic analysis failed.
---*)
