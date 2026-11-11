(*---
description: Evaluates a random seq expression, seed 262, number 7606.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07606 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(Append(Append(<<1>>, 2147483647), (7 + <<5, 6>>))), ((-(7 % 3)) \div ((<<1>> \div -1) % DOMAIN [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 105 to line 14, col 108 of module random_07606 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 99.
    | Expression starting at line 14, column 99.
    | ExtendableExpr starting at line 14, column 98.
    | Expression starting at line 14, column 98.
    | ExtendableExpr starting at line 14, column 97.
    | Fatal errors while parsing TLA+ spec in file random_07606
    | In module random_07606
    | Could not parse module random_07606 from file random_07606.tla
    | *** Errors: 1
    | In module random_07606
    | Could not parse module random_07606 from file random_07606.tla
    3002:1 Parsing or semantic analysis failed.
---*)
