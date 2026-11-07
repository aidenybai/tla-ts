(*---
description: Evaluates a random record expression, seed 262, number 8212.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08212 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE (~(~FALSE)) -> ((CHOOSE b12710 \in 2..1 : TRUE) \div (-1 \div -1)) [] OTHER -> Head(Append(<<1>>, -1)), b |-> (((7 \div 2) = LET b12711 == -1 IN 7) \/ (DOMAIN <<5, 6>> <=> (\E b12712 \in 2..1 : TRUE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 85 to line 14, col 88 of module random_08212 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 83.
    | Expression starting at line 14, column 82.
    | ExtendableExpr starting at line 14, column 81.
    | ExtendableExpr starting at line 14, column 44.
    | Expression starting at line 14, column 44.
    | Fatal errors while parsing TLA+ spec in file random_08212
    | In module random_08212
    | Could not parse module random_08212 from file random_08212.tla
    | *** Errors: 1
    | In module random_08212
    | Could not parse module random_08212 from file random_08212.tla
    3002:1 Parsing or semantic analysis failed.
---*)
