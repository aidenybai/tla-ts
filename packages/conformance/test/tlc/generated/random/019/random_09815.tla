(*---
description: Evaluates a random bool expression, seed 262, number 9815.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09815 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(([x \in Nat |-> x + 1] \o <<1, 2>>)) .. Len(Tail(<<>>))) = (((-7) * (7 \div -1)) .. (CASE TRUE -> 2147483647 [] OTHER -> 7 * LET b15240 == 2 IN 1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 94 to line 14, col 97 of module random_09815 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 92.
    | Expression starting at line 14, column 92.
    | ExtendableExpr starting at line 14, column 91.
    | ExtendableExpr starting at line 14, column 84.
    | Expression starting at line 14, column 84.
    | Fatal errors while parsing TLA+ spec in file random_09815
    | In module random_09815
    | Could not parse module random_09815 from file random_09815.tla
    | *** Errors: 1
    | In module random_09815
    | Could not parse module random_09815 from file random_09815.tla
    3002:1 Parsing or semantic analysis failed.
---*)
