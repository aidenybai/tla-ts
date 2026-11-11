(*---
description: Evaluates a random bool expression, seed 262, number 7987.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07987 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 \div -1) .. ([x \in 1..2 |-> x])[3]) \cup {(0 \div 3), CASE TRUE -> 0 [] OTHER -> 3}) <=> (((2147483647 - 2) \div (\E b12335 \in {1, 2} : TRUE)) = {(-0), Len(<<1, 2>>)})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 22 to line 14, col 25 of module random_07987 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 20.
    | Expression starting at line 14, column 20.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_07987
    | In module random_07987
    | Could not parse module random_07987 from file random_07987.tla
    | *** Errors: 1
    | In module random_07987
    | Could not parse module random_07987 from file random_07987.tla
    3002:1 Parsing or semantic analysis failed.
---*)
