(*---
description: Evaluates a random set expression, seed 262, number 5774.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05774 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE b8898 \in {2, 1, 3} : TRUE) + (0 * -1)) - Len((<<>> \o <<3, 1, 2>>))) : b8897 \in {((-1 + 0) - (7 % 7)), CASE (2 \/ TRUE) -> (7 \div 1) [] OTHER -> Head(<<1>>)}})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 60 to line 14, col 60 of module random_05774 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 58.
    | Expression starting at line 14, column 58.
    | ExtendableExpr starting at line 14, column 57.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | Fatal errors while parsing TLA+ spec in file random_05774
    | In module random_05774
    | Could not parse module random_05774 from file random_05774.tla
    | *** Errors: 1
    | In module random_05774
    | Could not parse module random_05774 from file random_05774.tla
    3002:1 Parsing or semantic analysis failed.
---*)
