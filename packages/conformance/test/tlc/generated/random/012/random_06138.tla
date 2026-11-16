(*---
description: Evaluates a random record expression, seed 262, number 6138.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06138 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (1 < 2) -> (0 \div -1) [] OTHER -> (2 % 3), b |-> (((1 :> 2))[3] < DOMAIN [x \in 1..2 |-> x])] EXCEPT !.a = @ + ([(-1 + 3) EXCEPT !.a = @ + Len(<<3, 1, 2>>)]).a])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 43 to line 14, col 46 of module random_06138 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 41.
    | Expression starting at line 14, column 41.
    | ExtendableExpr starting at line 14, column 40.
    | Expression starting at line 14, column 40.
    | Case Arm starting at line 14, column 29.
    | Fatal errors while parsing TLA+ spec in file random_06138
    | In module random_06138
    | Could not parse module random_06138 from file random_06138.tla
    | *** Errors: 1
    | In module random_06138
    | Could not parse module random_06138 from file random_06138.tla
    3002:1 Parsing or semantic analysis failed.
---*)
