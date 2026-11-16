(*---
description: Evaluates a random function expression, seed 262, number 2361.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02361 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(LET b3742 == 0 IN 0 :> (-1 \div -1)) EXCEPT ![((CHOOSE r \in [a : 2..1] : TRUE)).a] = (Head(<<3, 1, 2>>) - (-1 % -1))] @@ [(IF TRUE THEN 1 ELSE 2 :> Head(<<>>)) EXCEPT ![((-7) = (0 - -1))] = (([a |-> 1]).a - IF TRUE THEN 7 ELSE 7)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 46 to line 14, col 49 of module random_02361 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 44.
    | Expression starting at line 14, column 43.
    | ExtendableExpr starting at line 14, column 42.
    | ExtendableExpr starting at line 14, column 37.
    | Expression starting at line 14, column 37.
    | Fatal errors while parsing TLA+ spec in file random_02361
    | In module random_02361
    | Could not parse module random_02361 from file random_02361.tla
    | *** Errors: 1
    | In module random_02361
    | Could not parse module random_02361 from file random_02361.tla
    3002:1 Parsing or semantic analysis failed.
---*)
